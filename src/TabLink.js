import React from 'react';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';

export default function TabLink({ to, title, exact }) {
     const resolved = useResolvedPath(to);
     const isActive = useMatch({ path: resolved.pathname, end: exact === 'true' });
     const className = isActive ? 'active' : '';

     return (
        <li role="presentation" className={className}>
            <Link to={to}>
                {title}
            </Link>
        </li>);
}

