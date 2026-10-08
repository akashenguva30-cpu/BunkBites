$loginBody = @{
    username = "student"
    password = "Student@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

$orderBody = @{
    paymentMethod = "UPI"
    items = @(
        @{ menuItemId = 1; quantity = 1 }
    )
} | ConvertTo-Json

Write-Output "Creating Order..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers
    Write-Output "Create response:"
    $res | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Error: $_"
}

Write-Output "Fetching Orders..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method GET -Headers $headers
    Write-Output "Get response:"
    $res | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Error: $_"
}
