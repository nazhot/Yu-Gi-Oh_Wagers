import React, { useState } from "react";



export default function WagerInput(props: Object){

    const [wager, setWager] = useState("0");

    function onWagerUpdate(e: React.ChangeEvent<HTMLInputElement>){
        setWager(e.target.value);
    }

    return (
        <input value={wager} onChange={onWagerUpdate}/>
    );
}