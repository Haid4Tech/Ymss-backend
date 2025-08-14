# Attendance API Testing Guide

## New Endpoints

### 1. Get Attendance by Class and Date
```
GET /attendance/class/{classId}/date/{date}
```
**Example:**
```
GET /attendance/class/1/date/2024-01-15
```

**Response:**
```json
{
  "classId": 1,
  "date": "2024-01-15T00:00:00.000Z",
  "attendance": [
    {
      "studentId": 1,
      "userId": 1,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "class": { "id": 1, "name": "Class 10A" },
      "subjects": [
        {
          "subjectId": 1,
          "subjectName": "Mathematics",
          "attendance": {
            "id": 1,
            "status": "PRESENT",
            "date": "2024-01-15T00:00:00.000Z"
          }
        }
      ]
    }
  ]
}
```

### 2. Take Class Attendance (Bulk)
```
POST /attendance/class
```

**Request Body:**
```json
{
  "classId": 1,
  "date": "2024-01-15",
  "attendanceData": [
    {
      "studentId": 1,
      "subjectId": 1,
      "status": "PRESENT"
    },
    {
      "studentId": 2,
      "subjectId": 1,
      "status": "ABSENT"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance taken successfully",
  "date": "2024-01-15T00:00:00.000Z",
  "classId": 1,
  "results": [
    {
      "studentId": 1,
      "subjectId": 1,
      "status": "SUCCESS",
      "attendance": { ... }
    }
  ]
}
```

### 3. Get Class Attendance Summary
```
GET /attendance/class/{classId}/summary?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "classId": 1,
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T00:00:00.000Z"
  },
  "summary": [
    {
      "studentId": 1,
      "firstname": "John",
      "lastname": "Doe",
      "totalDays": 20,
      "presentDays": 18,
      "absentDays": 1,
      "lateDays": 1,
      "excusedDays": 0,
      "attendancePercentage": 90.0
    }
  ],
  "totalStudents": 25
}
```

## Testing with cURL

### Test 1: Get Attendance by Class and Date
```bash
curl -X GET "http://localhost:4000/attendance/class/1/date/2024-01-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Take Class Attendance
```bash
curl -X POST "http://localhost:4000/attendance/class" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "classId": 1,
    "date": "2024-01-15",
    "attendanceData": [
      {
        "studentId": 1,
        "subjectId": 1,
        "status": "PRESENT"
      }
    ]
  }'
```

### Test 3: Get Attendance Summary
```bash
curl -X GET "http://localhost:4000/attendance/class/1/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

- All endpoints require authentication (JWT token)
- Teachers can only take attendance for classes they teach
- Attendance statuses: PRESENT, ABSENT, LATE, EXCUSED
- Dates should be in ISO format (YYYY-MM-DD)
- The system automatically handles duplicate attendance records for the same date
