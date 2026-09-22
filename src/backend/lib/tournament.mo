import Array "mo:core/Array";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/tournament";

module {
  public type TeamId = Common.TeamId;
  public type FixtureId = Common.FixtureId;
  public type TieId = Common.TieId;
  public type Timestamp = Common.Timestamp;

  public type State = {
    var tournamentName : Text;
    var stageLabel : Text;
    var nextTeamId : Nat;
    var nextFixtureId : Nat;
    var nextTieId : Nat;
    var nextSessionId : Nat;
    teams : Map.Map<TeamId, Types.Team>;
    fixtures : Map.Map<FixtureId, Types.Fixture>;
    ties : Map.Map<TieId, Types.KnockoutTie>;
    sessions : Map.Map<Text, Types.AdminSession>;
  };

  public func initState() : State {
    {
      var tournamentName = "eFootball Tournament";
      var stageLabel = "League Stage";
      var nextTeamId = 1;
      var nextFixtureId = 1;
      var nextTieId = 1;
      var nextSessionId = 1;
      teams = Map.empty();
      fixtures = Map.empty();
      ties = Map.empty();
      sessions = Map.empty();
    };
  };

  // ---- Helpers ----

  func teamName(state : State, id : TeamId) : Text {
    switch (state.teams.get(id)) {
      case (?team) { team.name };
      case null { "Unknown Team" };
    };
  };

  func toMatchView(state : State, fixture : Types.Fixture) : Types.MatchView {
    {
      id = fixture.id;
      homeTeamName = teamName(state, fixture.homeTeamId);
      awayTeamName = teamName(state, fixture.awayTeamId);
      homeGoals = fixture.homeGoals;
      awayGoals = fixture.awayGoals;
      matchday = fixture.matchday;
      kickoff = fixture.kickoff;
      status = fixture.status;
    };
  };

  func toTieView(state : State, tie : Types.KnockoutTie) : Types.TieView {
    {
      id = tie.id;
      round = tie.round;
      slot = tie.slot;
      homeTeamName = switch (tie.homeTeamId) {
        case (?id) { ?teamName(state, id) };
        case null { null };
      };
      awayTeamName = switch (tie.awayTeamId) {
        case (?id) { ?teamName(state, id) };
        case null { null };
      };
      homeGoals = tie.homeGoals;
      awayGoals = tie.awayGoals;
      homePenalties = tie.homePenalties;
      awayPenalties = tie.awayPenalties;
      winnerTeamName = switch (tie.winnerTeamId) {
        case (?id) { ?teamName(state, id) };
        case null { null };
      };
    };
  };

  func roundRank(round : Types.KnockoutRound) : Nat {
    switch (round) {
      case (#roundOf16) { 0 };
      case (#quarterFinal) { 1 };
      case (#semiFinal) { 2 };
      case (#final) { 3 };
    };
  };

  func nextRound(round : Types.KnockoutRound) : ?Types.KnockoutRound {
    switch (round) {
      case (#roundOf16) { ?#quarterFinal };
      case (#quarterFinal) { ?#semiFinal };
      case (#semiFinal) { ?#final };
      case (#final) { null };
    };
  };

  func compareTies(a : Types.KnockoutTie, b : Types.KnockoutTie) : { #less; #equal; #greater } {
    let ra = roundRank(a.round);
    let rb = roundRank(b.round);
    if (ra < rb) { #less } else if (ra > rb) { #greater } else {
      Nat.compare(a.slot, b.slot);
    };
  };

  func compareLeagueRows(a : Types.LeagueRow, b : Types.LeagueRow) : { #less; #equal; #greater } {
    if (a.points > b.points) { #less } else if (a.points < b.points) { #greater } else if (
      a.goalDifference > b.goalDifference
    ) {
      #less;
    } else if (a.goalDifference < b.goalDifference) { #greater } else if (a.goalsFor > b.goalsFor) {
      #less;
    } else if (a.goalsFor < b.goalsFor) { #greater } else {
      Text.compare(a.teamName, b.teamName);
    };
  };

  func compareMatches(a : Types.MatchView, b : Types.MatchView) : { #less; #equal; #greater } {
    if (a.kickoff < b.kickoff) { #less } else if (a.kickoff > b.kickoff) { #greater } else {
      Nat.compare(a.id, b.id);
    };
  };

  // ---- Tournament state ----

  public func getTournamentState(state : State) : Types.TournamentState {
    { tournamentName = state.tournamentName; stageLabel = state.stageLabel };
  };

  public func statusText(status : Types.MatchStatus) : Text {
    switch (status) {
      case (#upcoming) { "upcoming" };
      case (#live) { "live" };
      case (#completed) { "completed" };
    };
  };

  public func roundText(round : Types.KnockoutRound) : Text {
    switch (round) {
      case (#roundOf16) { "roundOf16" };
      case (#quarterFinal) { "quarterFinal" };
      case (#semiFinal) { "semiFinal" };
      case (#final) { "final" };
    };
  };

  public func setStageLabel(state : State, stageLabel : Text) : () {
    state.stageLabel := stageLabel;
  };

  // ---- Teams ----

  public func listTeams(state : State) : [Types.Team] {
    state.teams.values().toArray();
  };

  public func createTeam(state : State, name : Text, shortCode : Text, crestUrl : ?Text) : Types.Team {
    let id = state.nextTeamId;
    state.nextTeamId := id + 1;
    let team : Types.Team = { id; name; shortCode; crestUrl };
    state.teams.add(id, team);
    team;
  };

  public func updateTeam(state : State, id : TeamId, name : Text, shortCode : Text, crestUrl : ?Text) : ?Types.Team {
    switch (state.teams.get(id)) {
      case (?existing) {
        let updated : Types.Team = { id = existing.id; name; shortCode; crestUrl };
        state.teams.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteTeam(state : State, id : TeamId) : Bool {
    switch (state.teams.get(id)) {
      case (?_) {
        state.teams.remove(id);
        true;
      };
      case null { false };
    };
  };

  // ---- Fixtures ----

  public func listFixtures(state : State) : [Types.Fixture] {
    state.fixtures.values().toArray();
  };

  public func createFixture(
    state : State,
    homeTeamId : TeamId,
    awayTeamId : TeamId,
    matchday : Nat,
    kickoff : Timestamp,
  ) : Types.Fixture {
    let id = state.nextFixtureId;
    state.nextFixtureId := id + 1;
    let fixture : Types.Fixture = {
      id;
      homeTeamId;
      awayTeamId;
      matchday;
      kickoff;
      homeGoals = null;
      awayGoals = null;
      status = #upcoming;
    };
    state.fixtures.add(id, fixture);
    fixture;
  };

  public func updateFixture(
    state : State,
    id : FixtureId,
    homeTeamId : TeamId,
    awayTeamId : TeamId,
    matchday : Nat,
    kickoff : Timestamp,
  ) : ?Types.Fixture {
    switch (state.fixtures.get(id)) {
      case (?existing) {
        let updated : Types.Fixture = {
          id = existing.id;
          homeTeamId;
          awayTeamId;
          matchday;
          kickoff;
          homeGoals = existing.homeGoals;
          awayGoals = existing.awayGoals;
          status = existing.status;
        };
        state.fixtures.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  // Index of the slot paired with `i` in the circle method: the mirror position
  // from the end of the rotation. Computed in Int so the subtraction cannot
  // trap; callers guarantee `i < slotCount / 2`, so the result is in range.
  func opponentIndex(slotCount : Nat, i : Nat) : Nat {
    (slotCount.toInt() - 1 - i.toInt()).toNat();
  };

  // Generates a complete single round-robin schedule for every currently
  // registered team using the circle method. Every unordered pairing meets
  // exactly once, home/away sides alternate across matchdays, and fixtures are
  // spread across matchdays. Existing fixtures are replaced. Generated
  // fixtures start in the upcoming state with no scores, so they do not affect
  // the league table until results are entered.
  public func generateRoundRobinFixtures(state : State) : [Types.Fixture] {
    let teamIds = state.teams.values().toArray().map(func team = team.id).sort();
    let teamCount = teamIds.size();
    if (teamCount < 2) {
      return [];
    };
    // Odd team counts get a bye, represented by a null slot in the rotation.
    let hasBye = teamCount % 2 == 1;
    let slotCount = if (hasBye) { teamCount + 1 } else { teamCount };
    var slots : [var ?TeamId] = Array.tabulate(
      slotCount,
      func i = if (i < teamCount) { ?teamIds[i] } else { null },
    ).toVarArray();

    let roundCount = slotCount - 1;
    let half = slotCount / 2;

    state.fixtures.clear();

    for (round in Nat.range(0, roundCount)) {
      let matchday = round + 1;
      var i = 0;
      while (i < half) {
        let first = slots[i];
        let second = slots[opponentIndex(slotCount, i)];
        switch (first, second) {
          case (?homeId, ?awayId) {
            // Alternate the home side by matchday so no team is always home.
            let (home, away) = if (round % 2 == 0) { (homeId, awayId) } else { (awayId, homeId) };
            ignore createFixture(state, home, away, matchday, 0);
          };
          case _ {};
        };
        i += 1;
      };
      // Rotate all slots except the first, which stays fixed: the last slot
      // moves to position 1 and positions 1..slotCount-2 shift right by one.
      let previous = slots;
      let rotated = List.empty<?TeamId>();
      rotated.add(previous[0]);
      rotated.add(previous[slotCount - 1]);
      var j = 1;
      while (j < slotCount - 1) {
        rotated.add(previous[j]);
        j += 1;
      };
      slots := rotated.toArray().toVarArray();
    };

    listFixtures(state);
  };

  public func deleteFixture(state : State, id : FixtureId) : Bool {
    switch (state.fixtures.get(id)) {
      case (?_) {
        state.fixtures.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func setFixtureResult(
    state : State,
    id : FixtureId,
    homeGoals : ?Nat,
    awayGoals : ?Nat,
    status : Types.MatchStatus,
  ) : ?Types.Fixture {
    switch (state.fixtures.get(id)) {
      case (?existing) {
        // A completed fixture must always carry both scores so it contributes to
        // the league table; missing goals are normalized to 0. Any other status
        // keeps the entered goals as-is (they simply do not affect standings).
        let (storedHome, storedAway) : (?Nat, ?Nat) = if (status == #completed) {
          (?(homeGoals ?? 0), ?(awayGoals ?? 0));
        } else {
          (homeGoals, awayGoals);
        };
        let updated : Types.Fixture = {
          id = existing.id;
          homeTeamId = existing.homeTeamId;
          awayTeamId = existing.awayTeamId;
          matchday = existing.matchday;
          kickoff = existing.kickoff;
          homeGoals = storedHome;
          awayGoals = storedAway;
          status;
        };
        state.fixtures.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  // ---- Knockout ----

  public func listKnockoutTies(state : State) : [Types.KnockoutTie] {
    state.ties.values().toArray().sort(compareTies);
  };

  public func createKnockoutTie(
    state : State,
    round : Types.KnockoutRound,
    slot : Nat,
    homeTeamId : ?TeamId,
    awayTeamId : ?TeamId,
  ) : Types.KnockoutTie {
    let id = state.nextTieId;
    state.nextTieId := id + 1;
    let tie : Types.KnockoutTie = {
      id;
      round;
      slot;
      homeTeamId;
      awayTeamId;
      homeGoals = null;
      awayGoals = null;
      homePenalties = null;
      awayPenalties = null;
      winnerTeamId = null;
    };
    state.ties.add(id, tie);
    tie;
  };

  // Decides a tie from its normal-time and penalty scores. Normal-time goals
  // decide first; when they are level the penalty shootout decides. A tie that
  // is level on both, or missing either score, stays undecided (null).
  func decideWinner(
    tie : Types.KnockoutTie,
    homeGoals : ?Nat,
    awayGoals : ?Nat,
    homePenalties : ?Nat,
    awayPenalties : ?Nat,
  ) : ?TeamId {
    switch (homeGoals, awayGoals) {
      case (?hg, ?ag) {
        if (hg > ag) {
          tie.homeTeamId;
        } else if (ag > hg) {
          tie.awayTeamId;
        } else {
          switch (homePenalties, awayPenalties) {
            case (?hp, ?ap) {
              if (hp > ap) { tie.homeTeamId } else if (ap > hp) { tie.awayTeamId } else { null };
            };
            case _ { null };
          };
        };
      };
      case _ { null };
    };
  };

  public func setKnockoutResult(
    state : State,
    id : TieId,
    homeGoals : ?Nat,
    awayGoals : ?Nat,
    homePenalties : ?Nat,
    awayPenalties : ?Nat,
  ) : ?Types.KnockoutTie {
    switch (state.ties.get(id)) {
      case (?existing) {
        let winner = decideWinner(existing, homeGoals, awayGoals, homePenalties, awayPenalties);
        let updated : Types.KnockoutTie = {
          id = existing.id;
          round = existing.round;
          slot = existing.slot;
          homeTeamId = existing.homeTeamId;
          awayTeamId = existing.awayTeamId;
          homeGoals;
          awayGoals;
          homePenalties;
          awayPenalties;
          winnerTeamId = winner;
        };
        state.ties.add(id, updated);
        advanceWinner(state, updated);
        ?updated;
      };
      case null { null };
    };
  };

  // Places a decided tie's winner into the next round's tie at slot slot / 2.
  // A feeder owns exactly one side of that target: even slots fill home, odd
  // slots fill away. Only the feeder's own side is written, so the sibling
  // feeder's winner on the opposite side is preserved. When this feeder's
  // winner changes or is removed, only its own side is cleared.
  func advanceWinner(state : State, tie : Types.KnockoutTie) {
    switch (nextRound(tie.round)) {
      case (?next) {
        let targetSlot = tie.slot / 2;
        let isHome = tie.slot % 2 == 0;
        switch (state.ties.values().find(func t = t.round == next and t.slot == targetSlot)) {
          case (?target) {
            let homeTeamId = if (isHome) { tie.winnerTeamId } else { target.homeTeamId };
            let awayTeamId = if (isHome) { target.awayTeamId } else { tie.winnerTeamId };
            let updated : Types.KnockoutTie = {
              id = target.id;
              round = target.round;
              slot = target.slot;
              homeTeamId;
              awayTeamId;
              homeGoals = target.homeGoals;
              awayGoals = target.awayGoals;
              homePenalties = target.homePenalties;
              awayPenalties = target.awayPenalties;
              winnerTeamId = target.winnerTeamId;
            };
            state.ties.add(target.id, updated);
          };
          case null {};
        };
      };
      case null {};
    };
  };

  public func deleteKnockoutTie(state : State, id : TieId) : Bool {
    switch (state.ties.get(id)) {
      case (?_) {
        state.ties.remove(id);
        true;
      };
      case null { false };
    };
  };

  // ---- Derived views ----

  // League standings are derived on read from the same fixture records the admin
  // edits. Only #completed fixtures contribute; live and upcoming fixtures never
  // affect the table. A win is worth 3 points, a draw 1, a loss 0. Every
  // registered team appears, even with no completed matches (all columns zero).
  // Rows are ordered by points, then goal difference, then goals for, then name.
  public func getLeagueTable(state : State) : [Types.LeagueRow] {
    let rows = List.empty<Types.LeagueRow>();
    for (team in state.teams.values()) {
      var played = 0;
      var won = 0;
      var drawn = 0;
      var lost = 0;
      var goalsFor = 0;
      var goalsAgainst = 0;
      for (fixture in state.fixtures.values()) {
        if (fixture.status == #completed) {
          // A completed fixture always counts; a missing score is treated as 0
          // so the fixture record and the table can never disagree.
          let hg = fixture.homeGoals ?? 0;
          let ag = fixture.awayGoals ?? 0;
          if (fixture.homeTeamId == team.id) {
            played += 1;
            goalsFor += hg;
            goalsAgainst += ag;
            if (hg > ag) { won += 1 } else if (hg == ag) { drawn += 1 } else { lost += 1 };
          } else if (fixture.awayTeamId == team.id) {
            played += 1;
            goalsFor += ag;
            goalsAgainst += hg;
            if (ag > hg) { won += 1 } else if (ag == hg) { drawn += 1 } else { lost += 1 };
          };
        };
      };
      rows.add({
        teamId = team.id;
        teamName = team.name;
        shortCode = team.shortCode;
        played;
        won;
        drawn;
        lost;
        goalsFor;
        goalsAgainst;
        goalDifference = goalsFor.toInt() - goalsAgainst.toInt();
        points = won * 3 + drawn;
      });
    };
    rows.toArray().sort(compareLeagueRows);
  };

  public func getBracket(state : State) : [Types.BracketRoundView] {
    let rounds : [Types.KnockoutRound] = [#roundOf16, #quarterFinal, #semiFinal, #final];
    let all = listKnockoutTies(state);
    rounds.map(
      func round = {
        round;
        ties = all.filter(func tie = tie.round == round).map(func tie = toTieView(state, tie));
      }
    );
  };

  public func getMatch(state : State, id : FixtureId) : ?Types.MatchView {
    switch (state.fixtures.get(id)) {
      case (?fixture) { ?toMatchView(state, fixture) };
      case null { null };
    };
  };

  public func getStatusMatches(state : State) : {
    upcoming : [Types.MatchView];
    live : [Types.MatchView];
    completed : [Types.MatchView];
  } {
    let views = state.fixtures.values().toArray().map(func fixture = toMatchView(state, fixture)).sort(compareMatches);
    {
      upcoming = views.filter(func m = m.status == #upcoming);
      live = views.filter(func m = m.status == #live);
      completed = views.filter(func m = m.status == #completed);
    };
  };

  // ---- Admin session ----

  public func adminLogin(state : State, username : Text, password : Text) : ?Types.AdminSession {
    if (username == "Midhu" and password == "Midhu@2006") {
      let token = "admin-" # state.nextSessionId.toText() # "-" # Time.now().toText();
      state.nextSessionId := state.nextSessionId + 1;
      let session : Types.AdminSession = { token; username };
      state.sessions.add(token, session);
      ?session;
    } else {
      null;
    };
  };

  public func adminLogout(state : State, token : Text) : Bool {
    switch (state.sessions.get(token)) {
      case (?_) {
        state.sessions.remove(token);
        true;
      };
      case null { false };
    };
  };

  public func isAdminSession(state : State, token : Text) : Bool {
    state.sessions.get(token) != null;
  };
};
