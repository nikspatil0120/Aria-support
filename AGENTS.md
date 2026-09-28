<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep customer support data access behind `src/lib/api.ts`; this lets future service connections replace demonstration data without changing UI components.
- Keep voice interaction behind the `VoiceSession` contract and `useVoiceSession`; this prevents provider details from entering presentation components.
