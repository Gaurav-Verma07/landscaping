'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { BookOpenIcon, InfoIcon, LifeBuoyIcon, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '../../../utils/utils';
import { signOut } from '@/app/auth/actions';
import { useRouter } from 'next/navigation';

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
);

// Types
export interface Navbar02NavItem {
  href?: string;
  label: string;
  submenu?: boolean;
  type?: 'description' | 'simple' | 'icon' | 'image';
  items?: Array<{
    href: string;
    label: string;
    description?: string;
    icon?: string;
    image?: string;
  }>;
}

export interface Navbar02Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar02NavItem[];
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
  user?: any; // Supabase user object
}

// Default navigation links
const defaultNavigationLinks: Navbar02NavItem[] = [
  { href: '#', label: 'Home' },
  {
    label: 'Features',
    submenu: true,
    type: 'image',
    items: [
      {
        href: '#analytics',
        label: 'Analytics',
        description: 'Gain insights into your property performance.',
        image: '/feature-analytics.png',
      },
      {
        href: '#automation',
        label: 'Automation',
        description: 'Automate routine tasks and workflows.',
        image: '/feature-automation.png',
      },
      {
        href: '#tenants',
        label: 'Tenants',
        description: 'Manage tenant relationships effectively.',
        image: '/feature-tenants.png',
      },
      {
        href: '#maintenance',
        label: 'Maintenance',
        description: 'Track and resolve maintenance requests.',
        image: '/feature-maintenance.png',
      },
    ],
  },
  {
    label: 'Pricing',
    submenu: true,
    type: 'simple',
    items: [
      { href: '#starter', label: 'Starter', description: 'Perfect for small landlords.' },
      { href: '#pro', label: 'Pro', description: 'For growing portfolios.' },
      { href: '#enterprise', label: 'Enterprise', description: 'Custom solutions for large agencies.' },
    ],
  },
  {
    label: 'Resources',
    submenu: true,
    type: 'icon',
    items: [
      { href: '#blog', label: 'Blog', icon: 'BookOpenIcon', description: 'Read our latest articles.' },
      { href: '#help', label: 'Help Center', icon: 'LifeBuoyIcon', description: 'Get support and answers.' },
      { href: '#about', label: 'About Us', icon: 'InfoIcon', description: 'Learn about our mission.' },
    ],
  },
];

export const Navbar02 = React.forwardRef<HTMLElement, Navbar02Props>(
  (
    {
      className,
      logo,
      logoHref = '#',
      navigationLinks = defaultNavigationLinks,
      signInText = 'Sign In',
      signInHref = '#signin',
      ctaText = 'Get Started',
      ctaHref = '#get-started',
      onSignInClick,
      onCtaClick,
      user,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const router = useRouter();

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const handleSignOut = async () => {
      await signOut();
    };

    return (
      <header
        ref={combinedRef}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline',
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-0">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          {link.submenu ? (
                            <>
                              <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                                {link.label}
                              </div>
                              <ul>
                                {link.items?.map((item, itemIndex) => (
                                  <li key={itemIndex}>
                                    <button
                                      onClick={() => item.href && router.push(item.href)}
                                      className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                                    >
                                      {item.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <button
                              onClick={() => link.href && router.push(link.href)}
                              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              {link.label}
                            </button>
                          )}
                          {/* Add separator between different types of items */}
                          {index < navigationLinks.length - 1 &&
                            ((!link.submenu && navigationLinks[index + 1].submenu) ||
                              (link.submenu && !navigationLinks[index + 1].submenu) ||
                              (link.submenu &&
                                navigationLinks[index + 1].submenu &&
                                link.type !== navigationLinks[index + 1].type)) && (
                              <div
                                role="separator"
                                aria-orientation="horizontal"
                                className="bg-border -mx-1 my-1 h-px w-full"
                              />
                            )}
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Logo */}
            <button 
              onClick={() => router.push(logoHref)}
              className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
            >
              <div className="text-2xl">
                {logo}
              </div>
            </button>
          </div>
          
          {/* Center - Navigation menu */}
          {!isMobile && (
            <div className="flex-1 flex justify-center">
              <NavigationMenu className="flex">
                <NavigationMenuList className="gap-1">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index}>
                      {link.submenu ? (
                        <>
                          <NavigationMenuTrigger>
                            {link.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            {link.type === 'image' ? (
                               <div className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    image={item.image}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : link.type === 'simple' ? (
                              <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : link.type === 'icon' ? (
                              <div className="grid w-[400px] gap-3 p-4">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    icon={item.icon}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : (
                              <div className="grid gap-3 p-4">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            )}
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink
                          href={link.href}
                          className={cn(navigationMenuTriggerStyle(), 'cursor-pointer')}
                        >
                          {link.label}
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => {
                    if (onSignInClick) {
                      e.preventDefault();
                      onSignInClick();
                    } else {
                      router.push(signInHref);
                    }
                  }}
                >
                  {signInText}
                </Button>
                <Button
                  size="sm"
                  className="text-sm font-medium px-4 h-9 rounded-md shadow-sm"
                  onClick={(e) => {
                    if (onCtaClick) {
                      e.preventDefault();
                      onCtaClick();
                    } else {
                      router.push(ctaHref);
                    }
                  }}
                >
                  {ctaText}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar02.displayName = 'Navbar02';

// ListItem component for navigation menu items
const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    title: string;
    href?: string;
    icon?: string;
    image?: string;
    type?: 'description' | 'simple' | 'icon' | 'image';
    children?: React.ReactNode;
  }
>(({ className, title, children, icon, image, type, ...props }, ref) => {
  const renderIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    switch (iconName) {
      case 'BookOpenIcon':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'LifeBuoyIcon':
        return <LifeBuoyIcon className="h-5 w-5" />;
      case 'InfoIcon':
        return <InfoIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <NavigationMenuLink asChild>
      <a
        ref={ref}

        className={cn(
          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer',
          className
        )}
        {...props}
      >
        {type === 'image' && image ? (
           <div className="flex items-start space-x-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              <img src={image} alt={title} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-medium leading-tight">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {children}
                </p>
              )}
            </div>
          </div>
        ) : type === 'icon' && icon ? (
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {renderIconComponent(icon)}
            </div>
            <div className="space-y-1">
              <div className="text-base font-medium leading-tight">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {children}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-base font-medium leading-none">{title}</div>
            {children && (
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {children}
              </p>
            )}
          </>
        )}
      </a>
    </NavigationMenuLink>
  );
});
ListItem.displayName = 'ListItem';

export { HamburgerIcon };
