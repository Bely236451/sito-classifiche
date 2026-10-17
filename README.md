# Campetto League

## Aggiornare i dati
Modifica solo `data.json`.
- Squadre: aggiorna `pg`, `v`, `p`, `s`, `gf`, `gs`. Punti, differenza reti e ordine sono automatici.
- Marcatori: cambia `gol` o aggiungi righe (il campo `squadra` deve essere identico al nome della squadra). Ordine automatico.
- Cambia `giornata` per aggiornare hero e footer.
- Nuova squadra: aggiungi il logo in `img/` e il percorso nel campo `logo`.

## Test in locale
`python3 -m http.server` nella cartella, poi http://localhost:8000

## Pubblicare gratis
**Netlify:** app.netlify.com/drop e trascina l'intera cartella (con `img/`).
**Vercel + GitHub:** carica la cartella su GitHub, poi su vercel.com "Add New > Project", importa il repo, Deploy.

## Calendario
In `data.json`, sezione `calendario` (e `playoff`). Per inserire un risultato compila `gc` (gol di chi gioca in casa, il primo nome) e `go` (gol dell'ospite) al posto di `null`. La partita passa da "VS" al punteggio e la "Prossima partita" in alto si aggiorna da sola. I nomi delle squadre devono essere uguali a quelli in `squadre`.
Nei playoff, quando si conoscono le squadre, sostituisci "2ª classificata" ecc. con il nome della squadra.
