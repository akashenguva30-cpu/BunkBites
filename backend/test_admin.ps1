$tokenAdmin = (Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="admin";password="Admin@123"}|ConvertTo-Json) -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $tokenAdmin"; "Content-Type" = "application/json" }

Write-Output "--- Fetching Users ---"
$users = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" -Method GET -Headers $headers
$users | ConvertTo-Json -Depth 2

Write-Output "--- Creating Staff ---"
$staffBody = @{
    username = "staffTest"
    email = "stafftest@example.com"
    password = "Password@123"
} | ConvertTo-Json
$createRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users/staff" -Method POST -Body $staffBody -Headers $headers
$createRes | ConvertTo-Json

Write-Output "--- Logging in as new staff ---"
$loginTest = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="staffTest";password="Password@123"}|ConvertTo-Json) -ContentType "application/json"
$loginTest | ConvertTo-Json

Write-Output "--- Fetching Users to get Staff ID ---"
$users2 = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" -Method GET -Headers $headers
$staffId = ($users2 | Where-Object { $_.username -eq "staffTest" }).id

Write-Output "--- Disabling Staff ---"
$disableBody = @{ enabled = $false } | ConvertTo-Json
$disableRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users/$staffId/status" -Method PUT -Body $disableBody -Headers $headers
$disableRes | ConvertTo-Json

Write-Output "--- Attempting Login as Disabled Staff ---"
try {
    $loginFail = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="staffTest";password="Password@123"}|ConvertTo-Json) -ContentType "application/json"
    $loginFail | ConvertTo-Json
} catch {
    Write-Output "Login failed as expected: $_"
}
