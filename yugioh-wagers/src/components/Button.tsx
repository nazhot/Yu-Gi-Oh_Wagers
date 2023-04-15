import { MouseEventHandler, ReactNode } from "react";

type buttonPar = {
    onClick: MouseEventHandler,
    children: ReactNode,
}

export default function Button( {onClick, children} : buttonPar){
    return (
        <button onClick={onClick}>
            {children}
        </button>
    );
}