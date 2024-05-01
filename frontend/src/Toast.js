import React from 'react';
import './Toast.css';
import { Button, Typography } from '@mui/material';

const Toast = ({ message, onClose, style, isError=true }) => {
  return (
    <div className={isError ? "error-toast" : "happy-toast"} style={style}>
      <div className="error-toast-content">
        <Typography className="error-toast-message">{message}</Typography>
        <Button className="error-toast-close" onClick={onClose}>
          &times;
        </Button>
      </div>
    </div>
  );
};

export default Toast;
