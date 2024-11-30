export default function Scoreboard({ scores }) {
    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Puntuaciones</h2>
            <div className="space-y-2">
                {scores.map((score, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{score.name}</span>
                        <span>{score.time}ms</span>
                    </div>
                ))}
            </div>
        </div>
    );
}