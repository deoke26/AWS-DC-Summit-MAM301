import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          Contoso University
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/students">
            Students
          </Button>
          <Button color="inherit" component={RouterLink} to="/courses">
            Courses
          </Button>
          <Button color="inherit" component={RouterLink} to="/departments">
            Departments
          </Button>
          <Button color="inherit" component={RouterLink} to="/instructors">
            Instructors
          </Button>
          <Button color="inherit" component={RouterLink} to="/notifications">
            Notifications
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
