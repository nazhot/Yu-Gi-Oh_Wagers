import React, { ChangeEventHandler, useState } from "react";

type wagerParam = {
    onUpdate: ChangeEventHandler<HTMLInputElement>,
    wager: string,
}

export default function WagerInput( {onUpdate, wager} : wagerParam){
    return (
        <input value={wager} onChange={onUpdate}/>
    );
}