$env:PGPASSWORD="Saibaba12?"
$menuItems = psql -U postgres -d smart_canteen -t -c "SELECT id FROM menu_items WHERE available = true LIMIT 1;"
$menuItemId = $menuItems.Trim()

if (-not $menuItemId) {
    Write-Host "No available menu item found."
    exit
}

$username = "stu_" + (Get-Random -Minimum 1000 -Maximum 9999)
$registerBody = @{
    username = $username
    email = "$username@example.com"
    password = "password123"
    role = @("student")
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" | Out-Null
    Write-Host "Registered successfully"
} catch {
    Write-Host "Registration error:"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResp = $reader.ReadToEnd()
        Write-Host $errResp
    }
}

$loginBody = @{
    username = $username
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token

Write-Host "Logged in successfully as $username. Token length: $($token.Length)"

$headers = @{
    "Authorization" = "Bearer $token"
}

$orderBody = @{
    items = @(
        @{
            menuItemId = $menuItemId
            quantity = 2
        }
    )
    paymentMethod = "RAZORPAY"
} | ConvertTo-Json

Write-Host "Calling POST /api/orders/razorpay/create-order..."
try {
    $rzpRes = Invoke-RestMethod -Uri "http://localhost:8080/api/orders/razorpay/create-order" -Method Post -Headers $headers -Body $orderBody -ContentType "application/json"
    $rzpResJson = $rzpRes | ConvertTo-Json -Depth 5
    
    Write-Host "Response HTTP Status: 200 OK"
    Write-Host "Response JSON:"
    Write-Host $rzpResJson
} catch {
    Write-Host "Error calling Razorpay endpoint:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResp = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $errResp
    }
}

Write-Host "Checking if any orders were created..."
$orders = psql -U postgres -d smart_canteen -t -c "SELECT COUNT(*) FROM orders;"
Write-Host "Total orders in DB: $($orders.Trim())"

$payments = psql -U postgres -d smart_canteen -t -c "SELECT COUNT(*) FROM payments;"
Write-Host "Total payments in DB: $($payments.Trim())"

$tokens = psql -U postgres -d smart_canteen -t -c "SELECT COUNT(*) FROM tokens;"
Write-Host "Total tokens in DB: $($tokens.Trim())"
