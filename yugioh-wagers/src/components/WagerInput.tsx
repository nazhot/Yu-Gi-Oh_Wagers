import React, { ChangeEventHandler, useState } from "react";

type wagerParam = {
    onUpdate: ChangeEventHandler<HTMLInputElement>,
    wager: string,
}

export default function WagerInput( {onUpdate, wager} : wagerParam){

    function onWagerUpdate(e: React.ChangeEvent<HTMLInputElement>){
        setWager(e.target.value);
    }

    return (
        <input value={wager} onChange={onUpdate}/>
    );
}