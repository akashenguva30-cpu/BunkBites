$token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0c3R1ZGVudCIsImlhdCI6MTc5MDQwOTA0MywiZXhwIjoxNzkwNDk1NDQzfQ.XlkQRMO_1ePED6I9C6w-vRUXnNZe6C_7k9IJLW-F5e9_akwwLH066vN9R5p66QWi"
$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Hitting protected endpoint with user's token:"
try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/student/test" -Method GET -Headers $headers
    Write-Output "Test response:"
    $testResponse
} catch {
    Write-Output "Error: $_"
}
