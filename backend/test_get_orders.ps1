$loginBody = @{
    username = "student"
    password = "Student@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

Write-Output "Fetching Orders..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method GET -Headers $headers
    Write-Output "Response:"
    $res | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Error: $_"
    $response = $_.Exception.Response
    if ($response) {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
