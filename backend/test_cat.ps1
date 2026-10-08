$loginBody = @{
    username = "admin"
    password = "Admin@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$headers = @{
    Authorization = "Bearer $token"
}

$catBody = @{
    name = "TestCategory"
    description = "A test category"
} | ConvertTo-Json

Write-Output "Creating Category..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/categories" -Method POST -Body $catBody -ContentType "application/json" -Headers $headers
    Write-Output "Success:"
    $res
} catch {
    Write-Output "Error: $_"
    $response = $_.Exception.Response
    if ($response) {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
