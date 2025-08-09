import React from 'react'

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
    animate?: boolean;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
                                               className = '',
                                               variant = 'rectangular',
                                               width,
                                               height,
                                               animate = true,
                                               style = {},
                                           }) => {
    const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''}`

    let shapeClasses = ''
    switch (variant) {
        case 'text':
            shapeClasses = 'rounded'
            break
        case 'circular':
            shapeClasses = 'rounded-full'
            break
        case 'rectangular':
        default:
            shapeClasses = 'rounded-md'
            break
    }

    const inlineStyle: React.CSSProperties = {
        ...style,
        ...(width !== undefined
            ? { width: typeof width === 'number' ? `${width}px` : width }
            : {}),
        ...(height !== undefined
            ? { height: typeof height === 'number' ? `${height}px` : height }
            : {}),
    }

    return (
        <div
            className={`${baseClasses} ${shapeClasses} ${className}`}
            style={inlineStyle}
        />
    )
}

export default Skeleton
