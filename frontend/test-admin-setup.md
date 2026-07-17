# Admin Dashboard Setup and Testing Guide

## Prerequisites

1. **Backend Server**: Ensure the backend is running on port 6081
2. **Frontend Server**: Ensure the frontend is running on port 6080
3. **Admin User**: You need a user with ADMIN role in the database

## Setup Steps

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Create an Admin User (if needed)
You can create an admin user by:
- Direct database update (set role = 'ADMIN' for a user)
- Or modify the user registration logic temporarily

### 4. Access the Admin Dashboard
1. Login with an admin user account
2. Navigate to `/admin` in your browser
3. You should see the admin dashboard

## Testing Checklist

### ✅ User Management (`/admin/users`)
- [ ] List all users with pagination
- [ ] Search users by email or name
- [ ] Filter users by role and status
- [ ] Edit user details (role, name, status)
- [ ] Activate/deactivate users

### ✅ Analytics Dashboard (`/admin/analytics`)
- [ ] View system-wide usage statistics
- [ ] Switch between time ranges (7d, 30d, 90d)
- [ ] View cost breakdown charts
- [ ] See top users and personas
- [ ] Export functionality (mock)

### ✅ Audit Logs (`/admin/audit`)
- [ ] View audit logs with filtering
- [ ] Search logs by various criteria
- [ ] View detailed log information
- [ ] Export logs (mock)

### ✅ System Monitoring (`/admin/monitoring`)
- [ ] View system health status
- [ ] See service availability
- [ ] Monitor performance metrics
- [ ] Check LLM provider status
- [ ] Enable/disable auto-refresh

### ✅ Admin Dashboard Overview (`/admin`)
- [ ] View quick stats
- [ ] See recent activity
- [ ] Access quick actions
- [ ] Navigate to all admin sections

## API Endpoints

The admin dashboard uses these backend endpoints:

### User Management
- `GET /api/admin/users` - List users with pagination
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId` - Update user
- `GET /api/admin/users/:userId/sessions` - Get user sessions

### Analytics
- `GET /api/admin/analytics/trends` - Get usage trends
- `GET /api/admin/analytics/cost-breakdown` - Get cost breakdown
- `GET /api/usage/admin/system-summary` - Get system summary
- `GET /api/usage/admin/top-users` - Get top users
- `GET /api/usage/admin/top-personas` - Get top personas

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/audit-logs/export` - Export audit logs

### Monitoring
- `GET /api/admin/monitoring/health` - Get system health
- `GET /api/admin/monitoring/metrics` - Get performance metrics

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/activity` - Get recent activity

## Mock Data

The admin dashboard currently uses mock data for:
- User listings
- Analytics charts
- Audit logs
- System monitoring metrics

To switch to real data:
1. Ensure backend endpoints are properly implemented
2. Update the API calls in `frontend/lib/api/admin.ts`
3. Remove mock data from page components

## Security Testing

### Access Control
- [ ] Non-admin users cannot access `/admin/*` routes
- [ ] Admin middleware correctly validates JWT tokens
- [ ] Role-based access control works on all endpoints

### Audit Trail
- [ ] All admin actions are logged
- [ ] Logs contain proper metadata (IP, user agent, timestamp)
- [ ] Sensitive actions are properly tracked

## Performance Testing

### Page Load Times
- [ ] Dashboard loads within 3 seconds
- [ ] Charts render smoothly
- [ ] Large datasets paginate correctly

### API Response Times
- [ ] User listing returns within 1 second
- [ ] Analytics data loads within 2 seconds
- [ ] Audit logs filter quickly

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Mobile Responsiveness

Test on:
- [ ] Mobile phones (portrait/landscape)
- [ ] Tablets (portrait/landscape)
- [ ] Desktop (various screen sizes)

## Known Issues

1. **TypeScript Errors**: Some Recharts type issues need fixing
2. **Mock Data**: Currently using mock data instead of real API calls
3. **Export Functionality**: Export buttons show mock behavior
4. **Real-time Updates**: Auto-refresh uses polling, not WebSockets

## Next Steps

### Phase 3.1: Real Data Integration
1. Connect to real backend APIs
2. Implement proper error handling
3. Add loading states and skeletons

### Phase 3.2: Advanced Features
1. Real-time notifications
2. Advanced filtering and search
3. Custom report generation
4. Bulk user operations

### Phase 3.3: Optimization
1. Implement caching
2. Add WebSocket support
3. Optimize database queries
4. Add CDN for static assets

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Check user role in database
   - Verify JWT token contains correct role
   - Check admin middleware configuration

2. **Blank pages or errors**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check network tab for failed requests

3. **Slow performance**
   - Check database indexes
   - Review query optimization
   - Consider pagination limits

4. **Missing data**
   - Verify audit logging is enabled
   - Check usage tracking configuration
   - Confirm database has test data

### Debugging Tips

1. Enable detailed logging in development
2. Use browser developer tools for API inspection
3. Check network requests for errors
4. Review server logs for backend issues
5. Test with smaller datasets first

## Support

For issues with the admin dashboard:
1. Check the documentation first
2. Review the code in `frontend/app/admin/`
3. Check backend routes in `backend/src/api/admin/`
4. Contact the development team if issues persist