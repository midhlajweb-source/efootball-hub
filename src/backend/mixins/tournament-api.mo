import Result "mo:core/Result";
import Common "../types/common";
import Types "../types/tournament";
import TournamentLib "../lib/tournament";

mixin (state : TournamentLib.State) {
  public type TeamId = Common.TeamId;
  public type FixtureId = Common.FixtureId;
  public type TieId = Common.TieId;
  public type Timestamp = Common.Timestamp;

  // ---- Public reads ----

  public query func getTournamentState() : async Types.TournamentState {
    TournamentLib.getTournamentState(state);
  };

  public query func listTeams() : async [Types.Team] {
    TournamentLib.listTeams(state);
  };

  public query func listFixtures() : async [Types.Fixture] {
    TournamentLib.listFixtures(state);
  };

  public query func listKnockoutTies() : async [Types.KnockoutTie] {
    TournamentLib.listKnockoutTies(state);
  };

  public query func getLeagueTable() : async [Types.LeagueRow] {
    TournamentLib.getLeagueTable(state);
  };

  public query func getBracket() : async [Types.BracketRoundView] {
    TournamentLib.getBracket(state);
  };

  public query func getMatch(id : FixtureId) : async ?Types.MatchView {
    TournamentLib.getMatch(state, id);
  };

  public query func getStatusMatches() : async {
    upcoming : [Types.MatchView];
    live : [Types.MatchView];
    completed : [Types.MatchView];
  } {
    TournamentLib.getStatusMatches(state);
  };

  // ---- Admin session ----

  public func adminLogin(username : Text, password : Text) : async ?Types.AdminSession {
    TournamentLib.adminLogin(state, username, password);
  };

  public func adminLogout(token : Text) : async Bool {
    TournamentLib.adminLogout(state, token);
  };

  public query func isAdminSession(token : Text) : async Bool {
    TournamentLib.isAdminSession(state, token);
  };

  // ---- Admin mutations ----

  func requireAdmin(token : Text) : Result.Result<(), Types.AdminError> {
    if (TournamentLib.isAdminSession(state, token)) {
      #ok(());
    } else {
      #err(#notAuthenticated);
    };
  };

  public func setStageLabel(token : Text, stageLabel : Text) : async Result.Result<(), Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        TournamentLib.setStageLabel(state, stageLabel);
        #ok(());
      };
    };
  };

  public func createTeam(token : Text, name : Text, shortCode : Text, crestUrl : ?Text) : async Result.Result<Types.Team, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (name == "") {
          #err(#invalidInput("Team name is required"));
        } else {
          #ok(TournamentLib.createTeam(state, name, shortCode, crestUrl));
        };
      };
    };
  };

  public func updateTeam(token : Text, id : TeamId, name : Text, shortCode : Text, crestUrl : ?Text) : async Result.Result<Types.Team, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        switch (TournamentLib.updateTeam(state, id, name, shortCode, crestUrl)) {
          case (?team) { #ok(team) };
          case null { #err(#notFound) };
        };
      };
    };
  };

  public func deleteTeam(token : Text, id : TeamId) : async Result.Result<(), Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (TournamentLib.deleteTeam(state, id)) { #ok(()) } else { #err(#notFound) };
      };
    };
  };

  public func createFixture(token : Text, homeTeamId : TeamId, awayTeamId : TeamId, matchday : Nat, kickoff : Timestamp) : async Result.Result<Types.Fixture, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (homeTeamId == awayTeamId) {
          #err(#invalidInput("A team cannot play itself"));
        } else {
          #ok(TournamentLib.createFixture(state, homeTeamId, awayTeamId, matchday, kickoff));
        };
      };
    };
  };

  public func updateFixture(token : Text, id : FixtureId, homeTeamId : TeamId, awayTeamId : TeamId, matchday : Nat, kickoff : Timestamp) : async Result.Result<Types.Fixture, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (homeTeamId == awayTeamId) {
          #err(#invalidInput("A team cannot play itself"));
        } else {
          switch (TournamentLib.updateFixture(state, id, homeTeamId, awayTeamId, matchday, kickoff)) {
            case (?fixture) { #ok(fixture) };
            case null { #err(#notFound) };
          };
        };
      };
    };
  };

  public func generateRoundRobinFixtures(token : Text) : async Result.Result<[Types.Fixture], Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        #ok(TournamentLib.generateRoundRobinFixtures(state));
      };
    };
  };

  public func deleteFixture(token : Text, id : FixtureId) : async Result.Result<(), Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (TournamentLib.deleteFixture(state, id)) { #ok(()) } else { #err(#notFound) };
      };
    };
  };

  public func setFixtureResult(token : Text, id : FixtureId, homeGoals : ?Nat, awayGoals : ?Nat, status : Types.MatchStatus) : async Result.Result<Types.Fixture, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        switch (TournamentLib.setFixtureResult(state, id, homeGoals, awayGoals, status)) {
          case (?fixture) { #ok(fixture) };
          case null { #err(#notFound) };
        };
      };
    };
  };

  public func createKnockoutTie(token : Text, round : Types.KnockoutRound, slot : Nat, homeTeamId : ?TeamId, awayTeamId : ?TeamId) : async Result.Result<Types.KnockoutTie, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        #ok(TournamentLib.createKnockoutTie(state, round, slot, homeTeamId, awayTeamId));
      };
    };
  };

  public func setKnockoutResult(token : Text, id : TieId, homeGoals : ?Nat, awayGoals : ?Nat, homePenalties : ?Nat, awayPenalties : ?Nat) : async Result.Result<Types.KnockoutTie, Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        switch (TournamentLib.setKnockoutResult(state, id, homeGoals, awayGoals, homePenalties, awayPenalties)) {
          case (?tie) { #ok(tie) };
          case null { #err(#notFound) };
        };
      };
    };
  };

  public func deleteKnockoutTie(token : Text, id : TieId) : async Result.Result<(), Types.AdminError> {
    switch (requireAdmin(token)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        if (TournamentLib.deleteKnockoutTie(state, id)) { #ok(()) } else { #err(#notFound) };
      };
    };
  };
};
