"use client";

import { useEffect, useState } from "react";

export default function SecurityPage() {

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const fetchSessions = async () => {
        try {

            const res = await fetch("/api/auth/sessions");
            const data = await res.json();

            if (res.ok) {
                setSessions(data.data);
            } else {
                setMessage("خطا در دریافت نشست‌ها");
            }

        } catch {
            setMessage("ارتباط با سرور برقرار نشد");
        } finally {
            setLoading(false);
        }
    };

    const logoutSession = async (id) => {
        try {

            const res = await fetch(`/api/auth/sessions/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMessage("نشست با موفقیت خارج شد");
                fetchSessions();
            } else {
                setMessage("خطا در خروج از نشست");
            }

        } catch {
            setMessage("مشکل در ارتباط با سرور");
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (loading) return <p>در حال بارگذاری...</p>;

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-4">
                تنظیمات امنیت حساب
            </h1>

            {message && (
                <div className="mb-4 text-sm text-blue-600">
                    {message}
                </div>
            )}

            {sessions.length === 0 ? (
                <p>هیچ نشست فعالی یافت نشد</p>
            ) : (
                <div className="space-y-4">

                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            className="border p-4 rounded-lg flex justify-between items-center"
                        >

                            <div>
                                <p className="font-semibold">
                                    {session.userAgent}
                                </p>

                                {session.isCurrent && (
                                    <p className="text-green-600 text-sm mt-1">
                                        این دستگاه فعلی شماست
                                    </p>
                                )}

                                <p className="text-sm text-gray-500">
                                    آی‌پی: {session.ip}
                                </p>
                                <p className="text-sm text-gray-400">
                                    تاریخ ورود: {new Date(session.createdAt).toLocaleString("fa-IR")}
                                </p>
                            </div>

                            <button
                                onClick={() => logoutSession(session._id)}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                خروج از این دستگاه
                            </button>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}
