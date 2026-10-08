$tokenAdmin = (Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="admin";password="Admin@123"}|ConvertTo-Json) -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $tokenAdmin"; "Content-Type" = "application/json" }

Write-Output "--- Fetching Admin Orders ---"
$orders = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/orders" -Method GET -Headers $headers
$orders | Select-Object -First 2 | ConvertTo-Json

Write-Output "--- Fetching Admin Payments ---"
$payments = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/payments" -Method GET -Headers $headers
$payments | Select-Object -First 2 | ConvertTo-Json
