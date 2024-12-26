import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { styled } from 'nativewind';
import { useTheme } from '../context/ThemeProvider';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface ButtonProps extends TouchableOpacityProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info' | 'warning' | 'ghost' | 'link';
    className?: string;
    textClassName?: string;
}

const Button = ({ onPress, title, variant = 'primary', className = '', textClassName = '', ...props }: ButtonProps) => {
    const { theme } = useTheme();

    const getVariantClasses = () => {
        switch (variant) {
            case 'secondary':
                return `${theme === 'dark' ? 'bg-dark-secondary' : 'bg-light-secondary'}`;
            case 'success':
                return `${theme === 'dark' ? 'bg-dark-success' : 'bg-light-success'}`;
            case 'danger':
                return `${theme === 'dark' ? 'bg-dark-danger' : 'bg-light-danger'}`;
            case 'info':
                return `${theme === 'dark' ? 'bg-dark-info' : 'bg-light-info'}`;
            case 'warning':
                return `${theme === 'dark' ? 'bg-dark-warning' : 'bg-light-warning'}`;
            case 'ghost':
                return `${theme === 'dark' ? 'bg-transparent border border-dark-primary' : 'bg-transparent border border-light-primary'}`;
            case 'link':
                return `${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`;
            default:
                return `${theme === 'dark' ? 'bg-dark-primary text-dark-text-primary' : 'bg-light-primary text-light-text-primary'}`;
        }
    };

    const getTextColorClasses = () => {
        switch (variant) {
            case 'ghost':
            case 'link':
                return `${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
            default:
                return `${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
        }
    };

    return (
        <StyledTouchableOpacity
            onPress={onPress}
            className={`${getVariantClasses()} px-4 py-3 rounded-lg items-center ${className}`}
            {...props}
        >
            <StyledText className={`font-medium ${getTextColorClasses()} ${textClassName}`}>
                {title}
            </StyledText>
        </StyledTouchableOpacity>
    );
};

export default Button;