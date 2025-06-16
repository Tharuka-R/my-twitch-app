import React, { type ReactNode } from 'react';
import { AppColors, Icons } from '../../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', leftIcon, rightIcon, ...props }) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out inline-flex items-center justify-center';
  
  const variantStyles = {
    primary: `bg-${AppColors.primary} hover:bg-purple-700 text-white focus:ring-purple-500`,
    secondary: `bg-${AppColors.accent} hover:bg-pink-600 text-white focus:ring-pink-400`,
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: `bg-transparent hover:bg-slate-700 text-${AppColors.textSecondary} hover:text-${AppColors.textPrimary} border border-${AppColors.border} focus:ring-slate-500`,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${AppColors.textSecondary} mb-1`}>{label}</label>}
      <input
        id={id}
        className={`bg-slate-700 border border-${AppColors.border} text-${AppColors.textPrimary} placeholder-slate-500 text-sm rounded-lg focus:ring-${AppColors.primary} focus:border-${AppColors.primary} block w-full p-2.5 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, error, children, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className={`block text-sm font-medium text-${AppColors.textSecondary} mb-1`}>{label}</label>}
      <select
        id={id}
        className={`bg-slate-700 border border-${AppColors.border} text-${AppColors.textPrimary} text-sm rounded-lg focus:ring-${AppColors.primary} focus:border-${AppColors.primary} block w-full p-2.5 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleIcon?: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, titleIcon }) => {
  return (
    <div className={`bg-${AppColors.cardBackground} shadow-xl rounded-xl p-4 sm:p-6 ${className}`}>
      {title && (
        <div className={`flex items-center text-xl font-semibold text-${AppColors.textPrimary} mb-4 pb-2 border-b border-${AppColors.border}`}>
          {titleIcon && <span className="mr-3 text-${AppColors.primary}">{titleIcon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, confirmText = "Confirm", onConfirm, cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-100">
      <div className={`bg-${AppColors.cardBackground} rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold text-${AppColors.textPrimary}`}>{title}</h2>
          <button onClick={onClose} className={`text-${AppColors.textSecondary} hover:text-${AppColors.textPrimary}`}>
            <Icons.PlusCircle className="w-6 h-6 transform rotate-45" /> {/* Close icon */}
          </button>
        </div>
        <div className={`text-${AppColors.textSecondary} mb-6`}>{children}</div>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
          {onConfirm && <Button variant="primary" onClick={onConfirm}>{confirmText}</Button>}
        </div>
      </div>
    </div>
  );
};

export const PageTitle: React.FC<{ title: string, icon?: ReactNode, actions?: ReactNode }> = ({ title, icon, actions }) => {
  return (
    <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center">
        {icon && <span className={`mr-3 text-${AppColors.primary} text-3xl`}>{icon}</span>}
        <h1 className={`text-2xl sm:text-3xl font-bold text-${AppColors.textPrimary}`}>{title}</h1>
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = "Loading..."}) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <Icons.ChartBar className="w-16 h-16 text-purple-500 animate-pulse mb-4" /> {/* Or a spinner icon */}
      <p className="text-xl text-slate-300">{message}</p>
    </div>
  );
};