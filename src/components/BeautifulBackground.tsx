const BeautifulBackground = () => {
    return (
        <div>
            <div class="absolute inset-0 -z-10 bg-slate-50 dark:bg-slate-950" />
            <div
                class="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
                style={{
                  'background-image': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />
            <div
                class="absolute left-1/2 top-0 -z-10 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-600/20"
                style={{ height: '480px', width: '800px' }}
            />
            <div class="absolute bottom-0 right-0 -z-10 h-64 w-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-900/20" />
        </div>
    );
};

export default BeautifulBackground;