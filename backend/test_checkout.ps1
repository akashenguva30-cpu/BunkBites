# Register student
$studentBody = @{
    username = "student"
    email = "student@canteen.com"
    password = "Student@123"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $studentBody -ContentType "application/json" | Out-Null
} catch {}

# Login student
$loginBody = @{
    username = "student"
    password = "Student@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# Checkout
$orderBody = @{
    paymentMethod = "UPI"
    items = @(
        @{ menuItemId = 1; quantity = 2 }
    )
} | ConvertTo-Json

Write-Output "Creating Order..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers
    Write-Output "Success! Token: $($res.token.tokenNumber), Total: $($res.totalAmount)"
} catch {
    Write-Output "Error: $_"
    $response = $_.Exception.Response
    if ($response) {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
