using System.Globalization;
using System.IO.Compression;
using System.Xml.Linq;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Hosting;

namespace Checklist.Api.Support;

public class ChecklistMonthlyPdfService
{
    private static readonly XNamespace Ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private static readonly XNamespace PackageRelationshipsNs = "http://schemas.openxmlformats.org/package/2006/relationships";
    private static readonly XNamespace ContentTypesNs = "http://schemas.openxmlformats.org/package/2006/content-types";
    private static readonly XNamespace XmlNs = XNamespace.Xml;
    private static readonly int[] ItemRowStarts = [13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49];
    private const int FooterRowStart = 52;
    private const int CommentsRowStart = 82;
    private const int CommentsRowStep = 3;
    private const int MaxComments = 25;
    private readonly string _templatePath;

    public ChecklistMonthlyPdfService(IWebHostEnvironment environment)
    {
        _templatePath = Path.Combine(environment.ContentRootPath, "Assets", "Templates", "Checklist - Empilhadeiras.xlsx");
    }

    public byte[] Generate(ChecklistMonthlySnapshot snapshot)
    {
        if (!File.Exists(_templatePath))
            throw new InvalidOperationException("Template mensal padrao nao encontrado no servidor.");

        if (snapshot.ModeloFechamentoMensal == FechamentoMensalModelo.Nenhum)
            throw new InvalidOperationException("A categoria do equipamento nao possui modelo mensal configurado.");

        var workDirectory = Path.Combine(Path.GetTempPath(), "checkflow-monthly", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workDirectory);

        try
        {
            var workbookPath = Path.Combine(workDirectory, "Checklist - Empilhadeiras.xlsx");
            File.Copy(_templatePath, workbookPath, true);

            FillWorkbook(workbookPath, snapshot);

            return File.ReadAllBytes(workbookPath);
        }
        finally
        {
            if (Directory.Exists(workDirectory))
                Directory.Delete(workDirectory, true);
        }
    }

    private static void FillWorkbook(string workbookPath, ChecklistMonthlySnapshot snapshot)
    {
        using var archive = ZipFile.Open(workbookPath, ZipArchiveMode.Update);

        var sheetEntryPath = KeepOnlyCategorySheet(archive, snapshot.ModeloFechamentoMensal);

        var worksheet = LoadXml(archive, sheetEntryPath);
        WriteHeader(worksheet, snapshot);
        WriteStatuses(worksheet, snapshot);
        WriteOperators(worksheet, snapshot);
        WriteComments(worksheet, snapshot);
        SaveXml(archive, sheetEntryPath, worksheet);
    }

    private static string KeepOnlyCategorySheet(ZipArchive archive, FechamentoMensalModelo modelo)
    {
        var selectedSheetPath = modelo == FechamentoMensalModelo.EmpilhadeiraEletrica
            ? "xl/worksheets/sheet2.xml"
            : "xl/worksheets/sheet1.xml";

        var workbook = LoadXml(archive, "xl/workbook.xml");
        var workbookRelationships = LoadXml(archive, "xl/_rels/workbook.xml.rels");
        var contentTypes = LoadXml(archive, "[Content_Types].xml");

        var sheetsElement = workbook.Root?.Element(Ns + "sheets")
            ?? throw new InvalidOperationException("Template mensal invalido: lista de abas nao encontrada.");

        var sheets = sheetsElement.Elements(Ns + "sheet").ToList();

        if (sheets.Count == 0)
            throw new InvalidOperationException("Template mensal invalido: nenhuma aba encontrada.");

        var selectedSheet = sheets.SingleOrDefault(x => string.Equals(GetWorksheetPath(workbookRelationships, x), selectedSheetPath, StringComparison.Ordinal))
            ?? throw new InvalidOperationException("Template mensal invalido: aba da categoria nao encontrada.");

        var selectedSheetIndex = sheets.IndexOf(selectedSheet);
        var removedSheets = sheets
            .Where(x => !ReferenceEquals(x, selectedSheet))
            .ToList();

        foreach (var removedSheet in removedSheets)
        {
            var removedSheetPath = GetWorksheetPath(workbookRelationships, removedSheet);
            if (removedSheetPath is null)
                continue;

            RemoveWorksheetPackageEntries(archive, workbookRelationships, contentTypes, removedSheetPath);
            removedSheet.Remove();
        }

        selectedSheet.Attribute("state")?.Remove();

        workbook.Root?
            .Element(Ns + "bookViews")?
            .Element(Ns + "workbookView")?
            .SetAttributeValue("activeTab", 0);

        workbook.Root?
            .Element(Ns + "bookViews")?
            .Element(Ns + "workbookView")?
            .SetAttributeValue("firstSheet", 0);

        NormalizeDefinedNames(workbook, selectedSheetIndex);

        SaveXml(archive, "xl/workbook.xml", workbook);
        SaveXml(archive, "xl/_rels/workbook.xml.rels", workbookRelationships);
        SaveXml(archive, "[Content_Types].xml", contentTypes);

        return selectedSheetPath;
    }

    private static void NormalizeDefinedNames(XDocument workbook, int selectedSheetIndex)
    {
        var definedNames = workbook.Root?.Element(Ns + "definedNames");
        if (definedNames is null)
            return;

        var names = definedNames.Elements(Ns + "definedName").ToList();
        foreach (var definedName in names)
        {
            var localSheetId = (string?)definedName.Attribute("localSheetId");
            if (!int.TryParse(localSheetId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var sheetIndex))
                continue;

            if (sheetIndex == selectedSheetIndex)
                definedName.SetAttributeValue("localSheetId", 0);
            else
                definedName.Remove();
        }

        if (!definedNames.Elements(Ns + "definedName").Any())
            definedNames.Remove();
    }

    private static string? GetWorksheetPath(XDocument workbookRelationships, XElement sheet)
    {
        var relationshipId = (string?)sheet.Attribute(XName.Get("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships"));
        if (string.IsNullOrWhiteSpace(relationshipId))
            return null;

        var target = workbookRelationships.Root?
            .Elements(PackageRelationshipsNs + "Relationship")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("Id"), relationshipId, StringComparison.Ordinal))
            ?.Attribute("Target")?
            .Value;

        return NormalizeWorkbookRelativePath(target);
    }

    private static void RemoveWorksheetPackageEntries(
        ZipArchive archive,
        XDocument workbookRelationships,
        XDocument contentTypes,
        string worksheetPath)
    {
        RemoveWorksheetRelationship(workbookRelationships, worksheetPath);
        RemoveContentTypeOverride(contentTypes, worksheetPath);

        var worksheetRelationshipsPath = GetRelationshipsPath(worksheetPath);
        if (archive.GetEntry(worksheetRelationshipsPath) is not null)
        {
            var worksheetRelationships = LoadXml(archive, worksheetRelationshipsPath);
            var drawingPaths = worksheetRelationships.Root?
                .Elements(PackageRelationshipsNs + "Relationship")
                .Select(x => NormalizeWorksheetRelativePath(worksheetPath, (string?)x.Attribute("Target")))
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Cast<string>()
                .ToList()
                ?? [];

            foreach (var drawingPath in drawingPaths)
            {
                RemoveContentTypeOverride(contentTypes, drawingPath);
                DeleteEntryIfExists(archive, drawingPath);
                DeleteEntryIfExists(archive, GetRelationshipsPath(drawingPath));
            }

            DeleteEntryIfExists(archive, worksheetRelationshipsPath);
        }

        DeleteEntryIfExists(archive, worksheetPath);
    }

    private static void RemoveWorksheetRelationship(XDocument workbookRelationships, string worksheetPath)
    {
        var relationship = workbookRelationships.Root?
            .Elements(PackageRelationshipsNs + "Relationship")
            .FirstOrDefault(x => string.Equals(
                NormalizeWorkbookRelativePath((string?)x.Attribute("Target")),
                worksheetPath,
                StringComparison.Ordinal));

        relationship?.Remove();
    }

    private static void RemoveContentTypeOverride(XDocument contentTypes, string partPath)
    {
        var normalizedPartPath = "/" + partPath.Replace('\\', '/').TrimStart('/');
        var overrideNode = contentTypes.Root?
            .Elements(ContentTypesNs + "Override")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("PartName"), normalizedPartPath, StringComparison.Ordinal));

        overrideNode?.Remove();
    }

    private static string GetRelationshipsPath(string xmlPath)
    {
        var normalizedPath = xmlPath.Replace('\\', '/');
        var directory = Path.GetDirectoryName(normalizedPath)?.Replace('\\', '/') ?? string.Empty;
        var fileName = Path.GetFileName(normalizedPath);
        return string.IsNullOrEmpty(directory)
            ? $"_rels/{fileName}.rels"
            : $"{directory}/_rels/{fileName}.rels";
    }

    private static string NormalizeWorkbookRelativePath(string? target)
    {
        if (string.IsNullOrWhiteSpace(target))
            return string.Empty;

        var normalized = target.Replace('\\', '/').TrimStart('/');
        return normalized.StartsWith("xl/", StringComparison.Ordinal)
            ? normalized
            : $"xl/{normalized}";
    }

    private static string NormalizeWorksheetRelativePath(string worksheetPath, string? target)
    {
        if (string.IsNullOrWhiteSpace(target))
            return string.Empty;

        var worksheetDirectory = Path.GetDirectoryName(worksheetPath.Replace('\\', '/'))?.Replace('\\', '/') ?? string.Empty;
        var combined = string.IsNullOrEmpty(worksheetDirectory)
            ? target.Replace('\\', '/')
            : $"{worksheetDirectory}/{target.Replace('\\', '/')}";

        var parts = combined.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var normalizedParts = new List<string>();

        foreach (var part in parts)
        {
            if (part == ".")
                continue;

            if (part == "..")
            {
                if (normalizedParts.Count > 0)
                    normalizedParts.RemoveAt(normalizedParts.Count - 1);

                continue;
            }

            normalizedParts.Add(part);
        }

        return string.Join("/", normalizedParts);
    }

    private static void DeleteEntryIfExists(ZipArchive archive, string entryPath)
    {
        archive.GetEntry(entryPath)?.Delete();
    }

    private static void WriteHeader(XDocument worksheet, ChecklistMonthlySnapshot snapshot)
    {
        SetCellText(worksheet, "J7", $"{snapshot.Mes:00}/{snapshot.Ano}");
        SetCellText(worksheet, "M7", snapshot.SetorNome);
        SetCellText(worksheet, "AQ7", snapshot.EquipamentoCodigo);
    }

    private static void WriteStatuses(XDocument worksheet, ChecklistMonthlySnapshot snapshot)
    {
        var rowsByOrder = snapshot.Linhas.ToDictionary(x => x.Ordem);

        for (var day = 1; day <= 31; day++)
        {
            var column = ToColumnName(11 + ((day - 1) * 2));

            for (var index = 0; index < ItemRowStarts.Length; index++)
            {
                var value = string.Empty;
                if (day <= snapshot.DiasNoMes &&
                    rowsByOrder.TryGetValue(index + 1, out var row) &&
                    day - 1 < row.ValoresPorDia.Count)
                {
                    value = row.ValoresPorDia[day - 1] ?? string.Empty;
                }

                SetCellText(worksheet, $"{column}{ItemRowStarts[index]}", value);
            }
        }
    }

    private static void WriteOperators(XDocument worksheet, ChecklistMonthlySnapshot snapshot)
    {
        var days = snapshot.Dias.ToDictionary(x => x.Dia);

        for (var day = 1; day <= 31; day++)
        {
            var column = ToColumnName(11 + ((day - 1) * 2));
            var value = days.TryGetValue(day, out var item)
                ? $"{item.OperadorMatricula}{Environment.NewLine}{item.OperadorNome}"
                : string.Empty;

            SetCellText(worksheet, $"{column}{FooterRowStart}", value);
        }
    }

    private static void WriteComments(XDocument worksheet, ChecklistMonthlySnapshot snapshot)
    {
        EnsureCommentsMergeLayout(worksheet);
        ClearCommentsArea(worksheet);

        var comments = snapshot.Comentarios
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Take(MaxComments)
            .ToList();

        if (snapshot.Comentarios.Count > MaxComments)
            comments[^1] = $"{comments[^1]}{Environment.NewLine}[Comentarios adicionais omitidos na planilha oficial.]";

        for (var index = 0; index < comments.Count; index++)
        {
            var rowNumber = CommentsRowStart + (index * CommentsRowStep);
            SetCellText(worksheet, $"B{rowNumber}", comments[index]);
        }
    }

    private static void EnsureCommentsMergeLayout(XDocument worksheet)
    {
        var root = worksheet.Root
            ?? throw new InvalidOperationException("Template mensal invalido.");

        var mergeCells = root.Element(Ns + "mergeCells");
        if (mergeCells is null)
        {
            mergeCells = new XElement(Ns + "mergeCells");
            root.Add(mergeCells);
        }

        var mergeEntries = mergeCells.Elements(Ns + "mergeCell").ToList();
        EnsureMergedRange(mergeCells, "B79:BT81");

        for (var index = 0; index < MaxComments; index++)
        {
            var rowStart = CommentsRowStart + (index * CommentsRowStep);
            EnsureMergedRange(mergeCells, $"B{rowStart}:BT{rowStart + 2}");
        }

        mergeCells.SetAttributeValue("count", mergeCells.Elements(Ns + "mergeCell").Count());
    }

    private static void EnsureMergedRange(XElement mergeCells, string range)
    {
        if (mergeCells.Elements(Ns + "mergeCell")
            .Any(x => string.Equals((string?)x.Attribute("ref"), range, StringComparison.Ordinal)))
        {
            return;
        }

        mergeCells.Add(new XElement(Ns + "mergeCell", new XAttribute("ref", range)));
    }

    private static void ClearCommentsArea(XDocument worksheet)
    {
        // B79 belongs to the legacy comment anchor and may still contain stale text in the template.
        SetCellTextIfExists(worksheet, "B79", string.Empty);

        for (var index = 0; index < MaxComments; index++)
        {
            var rowNumber = CommentsRowStart + (index * CommentsRowStep);
            SetCellTextIfExists(worksheet, $"B{rowNumber}", string.Empty);
        }
    }

    private static XDocument LoadXml(ZipArchive archive, string entryPath)
    {
        var entry = archive.GetEntry(entryPath)
            ?? throw new InvalidOperationException($"Arquivo interno do template nao encontrado: {entryPath}");

        using var stream = entry.Open();
        return XDocument.Load(stream);
    }

    private static void SaveXml(ZipArchive archive, string entryPath, XDocument document)
    {
        archive.GetEntry(entryPath)?.Delete();
        var entry = archive.CreateEntry(entryPath);

        using var stream = entry.Open();
        document.Save(stream);
    }

    private static void SetCellText(XDocument worksheet, string cellReference, string value)
    {
        var rowNumber = int.Parse(new string(cellReference.Where(char.IsDigit).ToArray()), CultureInfo.InvariantCulture);
        var sheetData = worksheet.Root?.Element(Ns + "sheetData")
            ?? throw new InvalidOperationException("Template mensal invalido.");

        var row = sheetData.Elements(Ns + "row")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("r"), rowNumber.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal))
            ?? throw new InvalidOperationException($"Linha {rowNumber} nao encontrada no template mensal.");

        var cell = row.Elements(Ns + "c")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("r"), cellReference, StringComparison.Ordinal))
            ?? throw new InvalidOperationException($"Celula {cellReference} nao encontrada no template mensal.");

        cell.SetAttributeValue("t", "inlineStr");
        cell.Elements(Ns + "v").Remove();
        cell.Elements(Ns + "is").Remove();
        cell.Add(new XElement(Ns + "is",
            new XElement(Ns + "t",
                new XAttribute(XmlNs + "space", "preserve"),
                value)));
    }

    private static void SetCellTextIfExists(XDocument worksheet, string cellReference, string value)
    {
        var rowNumber = int.Parse(new string(cellReference.Where(char.IsDigit).ToArray()), CultureInfo.InvariantCulture);
        var sheetData = worksheet.Root?.Element(Ns + "sheetData");
        if (sheetData is null)
            return;

        var row = sheetData.Elements(Ns + "row")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("r"), rowNumber.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal));
        if (row is null)
            return;

        var cell = row.Elements(Ns + "c")
            .FirstOrDefault(x => string.Equals((string?)x.Attribute("r"), cellReference, StringComparison.Ordinal));
        if (cell is null)
            return;

        cell.SetAttributeValue("t", "inlineStr");
        cell.Elements(Ns + "v").Remove();
        cell.Elements(Ns + "is").Remove();
        cell.Add(new XElement(Ns + "is",
            new XElement(Ns + "t",
                new XAttribute(XmlNs + "space", "preserve"),
                value)));
    }

    private static string ToColumnName(int columnNumber)
    {
        var name = string.Empty;
        var current = columnNumber;

        while (current > 0)
        {
            current--;
            name = (char)('A' + (current % 26)) + name;
            current /= 26;
        }

        return name;
    }
}
