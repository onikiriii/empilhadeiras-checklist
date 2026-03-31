using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

namespace Checklist.Api.Support;

public static class DatabaseErrorDetector
{
    public static bool IsDuplicateKey(DbUpdateException exception)
    {
        return exception.InnerException is MySqlException mySqlException
            && (mySqlException.Number == 1062 || mySqlException.SqlState == "23000");
    }
}
