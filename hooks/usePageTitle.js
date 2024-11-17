'use client'

import { usePathname } from 'next/navigation';

export const usePageTitle = () => {
    const pathname = usePathname();

    const capitalise = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const pageTitle = pathname
        .split('/')
        .filter(Boolean)
        .map(segment => segment.replace(/[-_]/g, ' '))
        .map(capitalise)
        .join(' - ');

    return pageTitle || 'Home';
};

