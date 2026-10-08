$body = @{
    username = "testuser2"
    email = "test2@test.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $body -ContentType "application/json"
Write-Output "Registration response:"
$response | Format-List

$loginBody = @{
    username = "testuser2"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Output "Login response:"
$loginResponse | Format-List

$token = $loginResponse.token
Write-Output "Extracted Token: $token"

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Hitting protected endpoint:"
try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/student/test" -Method GET -Headers $headers
    Write-Output "Test response:"
    $testResponse
} catch {
    Write-Output "Error: $_"
}
