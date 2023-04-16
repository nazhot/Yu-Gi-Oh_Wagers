import { useState } from "react";
import InformationPane from "./InformationPane";
import WagerForm from "./WagerForm";



export default function NavBar(props: Object){

    const [tokenCount, setTokenCount] = useState(1000);

    function onTokenUpdate(){
        setTokenCount(tokenCount + 1);
    }

    return(
        <div className="bottom-nav">
            <InformationPane
            name="Tokens"
            id="token-count"
            count={tokenCount}
            />
            <WagerForm/>
        </div>

    );

}