mixin () {
  // Static service-discoverability document for the eFootball Tournament backend.
  public query func getApiDoc() : async Text {
    "# eFootball Tournament Backend\n\n" #
    "Backend for a single eFootball tournament with two separate views: a league table and a knockout bracket. The admin creates all teams, fixtures, and knockout ties, and enters results. Knockout winners advance automatically.\n\n" #
    "## Authentication and authorization\n\n" #
    "- All read methods (getTournamentState, listTeams, listFixtures, listKnockoutTies, getLeagueTable, getBracket, getMatch, getStatusMatches) are public queries and require no sign-in.\n" #
    "- Admin access uses built-in credentials, not Internet Identity. Call adminLogin(username, password) with the configured admin credentials to receive an AdminSession containing a token. Pass that token as the first argument to every admin mutation.\n" #
    "- adminLogout(token) invalidates a session. isAdminSession(token) reports whether a token is currently valid.\n" #
    "- Every admin mutation returns Result.Result<T, AdminError>. An invalid or expired token yields #err(#notAuthenticated); a missing record yields #err(#notFound); invalid input yields #err(#invalidInput(message)).\n" #
    "- The app's frontend pins an Internet Identity derivation origin, published at /.well-known/ii-derivation-origin when available. An agent already holding the user's Internet Identity authorization derives the correct per-app principal against that origin (for example `icp identity link web <name> --app <host>`). Such a delegation acts with the user's full authority in this app until it expires. Note that admin access here is credential-based and does not depend on the caller principal.\n\n" #
    "## Units and encodings\n\n" #
    "- Timestamp is Int, nanoseconds since the Unix epoch (IC time).\n" #
    "- TeamId, FixtureId, and TieId are Nat identifiers assigned by the backend, starting at 1.\n" #
    "- crestUrl is an optional Text URL for a team crest image.\n" #
    "- MatchStatus is the variant #upcoming | #live | #completed.\n" #
    "- KnockoutRound is the variant #roundOf16 | #quarterFinal | #semiFinal | #final.\n" #
    "- homeGoals / awayGoals are optional Nat; null means no score entered.\n" #
    "- homePenalties / awayPenalties are optional Nat; null means no penalty shootout score entered. They are only meaningful when the normal-time scores are level.\n" #
    "- winnerTeamId is optional Nat; null means no winner determined yet.\n\n" #
    "## Lifecycle and polling\n\n" #
    "- A fixture starts as #upcoming. The admin sets #live while in progress and #completed with final scores via setFixtureResult.\n" #
    "- generateRoundRobinFixtures builds a complete single round-robin schedule for every currently registered team using the circle method. Every unordered pairing meets exactly once, home/away sides alternate across matchdays, and fixtures are spread across matchdays. All generated fixtures start as #upcoming with no scores, so they do not affect the league table until results are entered. It replaces all existing fixtures, so any previously entered results are discarded. Fewer than two registered teams yields an empty list and clears existing fixtures.\n" #
    "- Only #completed fixtures contribute to the league table (getLeagueTable); #live and #upcoming fixtures never affect standings. A win is worth 3 points, a draw 1, and a loss 0. Every registered team appears, even with no completed matches (all columns zero). Standings are ordered by points, then goal difference, then goals for, then team name. Setting a fixture's status away from #completed, or clearing its scores, removes its contribution on the next read.\n" #
    "- setKnockoutResult records normal-time scores and optional penalty shootout scores, then derives the winner. Normal-time goals decide first; when they are level the penalty score decides. A tie that is level on both, or missing either score, stays undecided (winnerTeamId null). When a winner is determined, that team is automatically placed into the next round's tie at slot slot / 2 (even slot fills home, odd slot fills away) and the opposite slot is cleared. Re-saving a result updates the downstream slot to the new winner and clears a stale previous winner; saving an undecided result clears both slots of the next-round target.\n" #
    "- Poll getStatusMatches for upcoming/live/completed groupings, getBracket for the knockout rounds, and getLeagueTable for standings. All are queries and safe to poll.\n\n" #
    "## Mutation retry safety\n\n" #
    "- Admin mutations are not idempotent. createTeam, createFixture, and createKnockoutTie allocate a new id on every call, so retrying a call that actually succeeded creates a duplicate record. Confirm the record exists before retrying.\n" #
    "- updateTeam, updateFixture, setFixtureResult, and setKnockoutResult overwrite the record with the supplied values and are safe to repeat with the same arguments.\n" #
    "- deleteTeam, deleteFixture, and deleteKnockoutTie return #err(#notFound) on a second call for the same id.\n" #
    "- generateRoundRobinFixtures is destructive and not additive: it clears all existing fixtures before inserting the generated schedule. Calling it twice with the same team list produces the same schedule, but any results entered between calls are lost.\n" #
    "- adminLogin creates a new session token on every successful call; old tokens remain valid until adminLogout is called for them.\n\n" #
    "## Errors, traps, and limits\n\n" #
    "- Admin mutations never trap on caller error; they return a typed AdminError.\n" #
    "- createFixture and updateFixture reject a fixture where the home and away team are the same with #err(#invalidInput(\"A team cannot play itself\")).\n" #
    "- createTeam rejects an empty team name with #err(#invalidInput(\"Team name is required\")).\n" #
    "- Deleting a team does not remove fixtures or knockout ties that reference it; those references then resolve to the placeholder name \"Unknown Team\".\n";
  };
};
