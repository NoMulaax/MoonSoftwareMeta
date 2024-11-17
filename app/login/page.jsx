import { Suspense } from 'react';
import LoginPage from '../../components/LoginPage';

export const metadata = {
    title: 'Login | Panel'
}

export default function Page() {
    return <Suspense fallback={<div></div>}>
        <LoginPage />
    </Suspense>
}
