import React, { useState, useEffect } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewDay as DayIcon,
  List as ListIcon,
} from '@mui/icons-material';

const ViewToggle = ({ value, onChange, disabled = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load saved view from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('calendar-view');
    if (savedView && ['calendar', 'day', 'list'].includes(savedView)) {
      onChange(savedView);
    }
  }, [onChange]);

  // Save view to localStorage when changed
  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      onChange(newValue);
      localStorage.setItem('calendar-view', newValue);
    }
  };

  const views = [
    {
      value: 'calendar',
      label: 'יומן',
      icon: <CalendarIcon />,
      tooltip: 'תצוגת יומן חודשי עם פאנל פרטי יום'
    },
    {
      value: 'day',
      label: 'יום',
      icon: <DayIcon />,
      tooltip: 'תצוגה מפורטת של יום נבחר'
    },
    {
      value: 'list',
      label: 'רשימה',
      icon: <ListIcon />,
      tooltip: 'תצוגת רשימה עם סינון ומיון'
    }
  ];

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      disabled={disabled}
      size={isMobile ? 'small' : 'medium'}
      sx={{
        '& .MuiToggleButton-root': {
          border: `1px solid ${theme.palette.divider}`,
          '&:not(:first-of-type)': {
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      }}
    >
      {views.map((view) => (
        <Tooltip key={view.value} title={view.tooltip} placement="bottom">
          <ToggleButton value={view.value}>
            {isMobile ? view.icon : (
              <>
                {view.icon}
                <span style={{ marginRight: theme.spacing(0.5) }}>
                  {view.label}
                </span>
              </>
            )}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};

export default ViewToggle;
