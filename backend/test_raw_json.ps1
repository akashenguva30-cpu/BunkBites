$loginBody = @{
    username = "student"
    password = "Student@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

try {
    $req = Invoke-WebRequest -Uri "http://localhost:8080/api/orders" -Method GET -Headers $headers
    Write-Output "Raw JSON:"
    Write-Output $req.Content
} catch {
    Write-Output "Error: $_"
}
