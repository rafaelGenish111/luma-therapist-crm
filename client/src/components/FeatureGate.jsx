import { useAuth } from '../context/AuthContext';

export default function FeatureGate({ feature = 'calendly', children, fallback = null }) {
    const { user } = useAuth(); // expects { role, plan, features, featureOverrides }
    if (!user) return null;

    const planOk = ['premium', 'extended'].includes(user?.plan);
    const overrideOk = Boolean(user?.featureOverrides?.[feature]);
    const enabled = planOk || overrideOk;

    return enabled ? children : (fallback ?? null);
}


