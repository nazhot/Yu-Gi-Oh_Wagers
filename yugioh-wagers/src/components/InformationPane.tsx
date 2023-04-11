export type Pane = {
    name: string,
    id: string,
    count: number,
}

export default function InformationPane({name, count, id}: Pane){
    return (
        <>
        <span>{name}</span><span id={id}>{count}</span>
        </>
    );
}