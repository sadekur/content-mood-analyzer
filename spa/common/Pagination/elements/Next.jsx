import React from "react";

export default function Next({ baseSlug = "dashboard", current = 1, total = 1, assets = "" }) {
    const nextIcon = `${assets || CONTMOAN?.assets}admin/img/icons/Next.png`;

    return (
        <>
            {current < total ? (
                <a
                    href={`#/${baseSlug}/page/${parseInt(current) + 1}`}
                    className="flex text-ec-title font-inter text-sm leading-5 items-center gap-2 py-2 px-3 border border-ec-table-stock rounded-[4px] hover:border-ec-primary hover:text-ec-title active:text-ec-title active:shadow-none focus:text-ec-title focus:shadow-none"
                >
                    <span>Next</span>
                    <div>
                        <img
                            src={nextIcon}
                            width={8}
                            height={5}
                            alt="arrow"
                            className="pointer-events-none"
                        />
                    </div>
                </a>
            ) : (
                <div className="flex text-ec-title font-inter text-sm leading-5 items-center gap-2 py-2 px-3 border border-ec-table-stock rounded-[4px] hover:text-ec-title cursor-not-allowed active:text-ec-title active:shadow-none focus:text-ec-title focus:shadow-none">
                    <span>Next</span>
                    <div>
                        <img
                            src={nextIcon}
                            width={8}
                            height={5}
                            alt="arrow"
                            className="pointer-events-none"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
