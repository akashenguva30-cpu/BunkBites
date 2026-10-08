$tokenStudent = (Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body (@{username="student";password="Student@123"}|ConvertTo-Json) -ContentType "application/json").token
$orders = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method GET -Headers @{ Authorization = "Bearer $tokenStudent" }
$orders[0] | ConvertTo-Json -Depth 3
