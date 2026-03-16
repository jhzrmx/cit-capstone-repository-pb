const BeautifulBackground = () => {
    return (
        <div>
            <div class="absolute inset-0 -z-10 bg-slate-50 dark:bg-slate-950" />
            <div class="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]" />
            <div class="absolute left-1/2 top-0 -z-10 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-600/20" />
            <div class="absolute bottom-0 right-0 -z-10 h-64 w-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-900/20" />
        </div>
    );
};

export default BeautifulBackground;