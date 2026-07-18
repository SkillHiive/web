import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import React from 'react';

type DropdownProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    className: string;
};

export function Dropdown({ title, children, className }: DropdownProps) {
    return (
        <Menu>
            <MenuButton className={`px-4 py-2 rounded-2xl border-1 border-white/20 hover:bg-white/30 ` + className}>
                {title}
            </MenuButton>

            <MenuItems anchor="bottom end" className="dropdown w-50 rounded-2xl border-1 border-white/30 mt-1 !overflow-hidden">
                {children}
            </MenuItems>
        </Menu>
    );
}

type DropItemProps = {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
};

export function DropItem({ children, onClick, className }: DropItemProps) {
    return (
        <MenuItem>
            <div
                onClick={onClick}
                className={`item bg-white/20 px-5 py-2  ${className}`}
            >
                {children}
            </div>
        </MenuItem>
    );
}