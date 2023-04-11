export type CardObject = {
    name: string,
    id: string,
    desc: string,
    isLarge: boolean,
}

export default function Card({name, id, desc, isLarge}: CardObject){
    const baseUrl:   string = isLarge? "https://images.ygoprodeck.com/images/cards/": "https://images.ygoprodeck.com/images/cards_small/";
    const className: string = isLarge? "large-card card" : "card";
    const url:       string = baseUrl + id + ".jpg";
    return (
        <>
        <img src={url} className={className}/>
        {desc.length > 0 && <p className="card-description">{desc}</p>}
        </>
    );
}