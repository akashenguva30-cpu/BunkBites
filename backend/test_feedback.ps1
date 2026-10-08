$ErrorActionPreference = "Stop"

function Login($user, $pass) {
    $body = @{ username = $user; password = $pass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    return $res.token
}

$tokenStudent = Login "student" "Student@123"
$tokenStaff = Login "staff" "Staff@123"
$tokenAdmin = Login "admin" "Admin@123"

# A. Student creates order
$orderBody = @{ items = @( @{ menuItemId = 1; quantity = 1 } ); paymentMethod = "CASH"; paymentDetails = "" } | ConvertTo-Json -Depth 5
$order = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
$orderId = $order.id

# Staff moves order to COLLECTED
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId/status?status=ACCEPTED" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId/status?status=PREPARING" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId/status?status=READY" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId/status?status=COLLECTED" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }

# B. Submit 5-star feedback
$fbBody = @{ orderId = $orderId; rating = 5; comment = "Awesome!" } | ConvertTo-Json
$fb1 = Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
$ratingResult = ($fb1.rating -eq 5)
Write-Output "B (5-star): $ratingResult"

# C. Submit again -> rejected
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
    Write-Output "C (Double submit): FAILED (Should have thrown 409)"
} catch {
    Write-Output "C (Double submit): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# E. Rate PREPARING order -> rejected
$orderBody2 = @{ items = @( @{ menuItemId = 1; quantity = 1 } ); paymentMethod = "CASH"; paymentDetails = "" } | ConvertTo-Json -Depth 5
$order2 = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody2 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
$orderId2 = $order2.id
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId2/status?status=ACCEPTED" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId2/status?status=PREPARING" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
try {
    $fbBody2 = @{ orderId = $orderId2; rating = 4; comment = "..." } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody2 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
    Write-Output "E (Preparing): FAILED"
} catch {
    Write-Output "E (Preparing): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# F. Rate CANCELLED -> rejected
$orderBody3 = @{ items = @( @{ menuItemId = 1; quantity = 1 } ); paymentMethod = "CASH"; paymentDetails = "" } | ConvertTo-Json -Depth 5
$order3 = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method POST -Body $orderBody3 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
$orderId3 = $order3.id
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId3/cancel" -Method PUT -Headers @{ Authorization = "Bearer $tokenStudent" }
try {
    $fbBody3 = @{ orderId = $orderId3; rating = 4; comment = "..." } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody3 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
    Write-Output "F (Cancelled): FAILED"
} catch {
    Write-Output "F (Cancelled): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# G. Rating 0 -> rejected
try {
    $fbBody0 = @{ orderId = $orderId; rating = 0; comment = "..." } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody0 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
    Write-Output "G (Rating 0): FAILED"
} catch {
    Write-Output "G (Rating 0): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# H. Rating 6 -> rejected
try {
    $fbBody6 = @{ orderId = $orderId; rating = 6; comment = "..." } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody6 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
    Write-Output "H (Rating 6): FAILED"
} catch {
    Write-Output "H (Rating 6): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# I. Comment omitted -> succeeds
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId2/status?status=READY" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId2/status?status=COLLECTED" -Method PUT -Headers @{ Authorization = "Bearer $tokenStaff" }
$fbBody4 = @{ orderId = $orderId2; rating = 3 } | ConvertTo-Json
$fb4 = Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody4 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStudent" }
$rRes = ($fb4.rating -eq 3)
Write-Output "I (No comment): $rRes"

# J. Menu item average rating
$menu = Invoke-RestMethod -Uri "http://localhost:8080/api/menu/1" -Method GET -Headers @{ Authorization = "Bearer $tokenStudent" }
Write-Output "J (Average): avg=$($menu.averageRating) count=$($menu.ratingCount)"

# K. Staff cannot submit feedback
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/feedback" -Method POST -Body $fbBody4 -ContentType "application/json" -Headers @{ Authorization = "Bearer $tokenStaff" }
    Write-Output "K (Staff submit): FAILED"
} catch {
    Write-Output "K (Staff submit): Rejected ($($_.Exception.Response.StatusCode.value__))"
}

# L. Admin can view feedback
$fbs = Invoke-RestMethod -Uri "http://localhost:8080/api/feedback/all" -Method GET -Headers @{ Authorization = "Bearer $tokenAdmin" }
Write-Output "L (Admin view): count=$($fbs.Length)"
