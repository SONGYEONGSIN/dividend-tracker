'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PieChart,
    Banknote,
    TrendingUp,
    Settings,
    BarChart3,
} from 'lucide-react';
import styles from './layout.module.css';

const NAV_ITEMS = [
    { href: '/', label: '대시보드', icon: LayoutDashboard },
    { href: '/portfolio', label: '포트폴리오', icon: PieChart },
    { href: '/dividends', label: '배당관리', icon: Banknote },
    { href: '/performance', label: '수익률분석', icon: TrendingUp },
    { href: '/settings', label: '설정', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <BarChart3 size={20} />
                    </div>
                    <div className={styles.logoText}>
                        <h1>DividendFlow</h1>
                        <p>배당 투자 관리</p>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    © 2025 DividendFlow
                </div>
            </aside>

            <main className={styles.main}>{children}</main>
        </div>
    );
}
