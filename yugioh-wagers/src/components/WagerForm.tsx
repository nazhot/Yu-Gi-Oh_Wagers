import WagerInput from "./WagerInput";
import Button from "./Button";
import React, { useState } from "react";

export default function WagerForm( props: Object){

    const [wager, setWager] = useState("0");

    function onSubmit(e: React.MouseEvent){
        e.preventDefault();
        alert(wager);
    }

    function onWagerChange(e: React.ChangeEvent<HTMLInputElement>){
        e.preventDefault();
        setWager(e.target.value);
    }

    return (
        <form>
            <WagerInput wager={wager} onUpdate={onWagerChange}/>
            <Button onClick={onSubmit}>Submit Wager</Button>
        </form>
    );
}