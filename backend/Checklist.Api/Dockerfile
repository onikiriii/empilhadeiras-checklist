FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar tudo da pasta atual
COPY . .

# Restaurar dependências
RUN dotnet restore "Checklist.Api.csproj"

# Build e publish
RUN dotnet publish "Checklist.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Checklist.Api.dll"]