import { useEffect, useState, useRef, useLayoutEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

const PortalDropdown = ({ anchorEl, open, onClose, children }: PortalDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // Calculate position
    useLayoutEffect(() => {
        if (open && anchorEl) {
            const updatePosition = () => {
                const rect = anchorEl.getBoundingClientRect();
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                const windowHeight = window.innerHeight;

                // Default width of w-40 is 10rem = 160px. 
                // We'll calculate safe position.
                // Align right edge of dropdown with right edge of anchor roughly, 
                // but usually kebab menus open 'leftwards' if they are on the right side of the screen.

                // Let's assume standard width of 160px for the dropdown for calculation if we haven't rendered yet.
                // Better: Render first, then measure? 
                // For simplicity/speed in this UI:
                const width = 160;

                let top = rect.bottom + scrollY + 4; // 4px spacing
                let left = rect.right + scrollX - width;

                // Check for bottom overflow
                // If the menu would go off the bottom of the screen, show it ABOVE the button
                // Estimate height ~ 150px
                if (rect.bottom + 150 > windowHeight) {
                    // Position above
                    // We need the actual height ideally, but let's guess standard height or use layout effect with opacity
                    // For now, let's just use bottom-up only if very close to edge
                }

                // More robust overflow check using the ref if available (on updates)
                if (dropdownRef.current) {
                    const dropdownRect = dropdownRef.current.getBoundingClientRect();
                    if (rect.bottom + dropdownRect.height + 10 > windowHeight) {
                        top = rect.top + scrollY - dropdownRect.height - 4;
                    }
                }

                setPosition({ top, left });
                setIsVisible(true);
            };

            updatePosition();

            // Events to close/reposition
            window.addEventListener('resize', onClose);
            window.addEventListener('scroll', onClose, { capture: true }); // Close on scroll usually feels better for detached menus than chasing the element

            return () => {
                window.removeEventListener('resize', onClose);
                window.removeEventListener('scroll', onClose, { capture: true });
            };
        } else {
            setIsVisible(false);
        }
    }, [open, anchorEl, onClose]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                anchorEl &&
                !anchorEl.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open, onClose, anchorEl]);

    if (!open || !anchorEl) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                opacity: isVisible ? 1 : 0,
                zIndex: 9999,
            }}
            className="w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 transition-opacity duration-75"
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

export default PortalDropdown;
