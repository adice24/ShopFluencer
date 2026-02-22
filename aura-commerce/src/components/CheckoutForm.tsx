import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fetchApi } from '../lib/api';

interface CheckoutFormProps {
    clientSecret: string;
    onSuccess: () => void;
    total: string;
}

export default function CheckoutForm({ clientSecret, onSuccess, total }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/success`,
            },
            redirect: 'if_required', // Avoids immediate redirect for better UX tracking
        });

        if (error) {
            setMessage(error.message ?? 'An unexpected error occurred.');
            setIsProcessing(false);
        } else {
            // Payment succeeded
            onSuccess();
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement id="payment-element" />

            {message && <div className="text-destructive text-sm font-semibold p-2 bg-destructive/10 rounded-lg">{message}</div>}

            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : `Pay $${total}`}
            </button>
        </form>
    );
}
