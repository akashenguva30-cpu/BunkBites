$tokenStudent = (Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="student";password="Student@123"}|ConvertTo-Json) -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $tokenStudent"; "Content-Type" = "application/json" }

$orderBody = @{
    items = @(
        @{ menuItemId = 1; quantity = 1 }
    )
    paymentMethod = "CASH"
} | ConvertTo-Json

$newOrder = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody -Headers $headers
$newId = $newOrder.id

Write-Output "Created Order ID: $newId"

$q = Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$newId/queue" -Method GET -Headers $headers
$q | ConvertTo-Json
