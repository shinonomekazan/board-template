# board-template

## どんなもの？

KANBANボードを自動的に作成し、そこにあらかじめIssueを登録しておきます。

ドライバーで拡張可能にしようと思いますが、直近の個人的な需要のため、とりあえずGitHub Projectのサポートをします。

## どういう時に使うの？

スプリントのようにチケット繰り越しという使い方ではなく、かつ複数の類似KANBANを繰り返し作成したいという限定的な用途で利用されます。

以下のような用途に対応します。

- スプリントにしたいが、諸事情でGitHub Projectで管理する
- KANBANを特定のrepositoryで管理し、それぞれ関連する類似repositoryが別に立っている
- repository作成当初のタスクの定形化
- リリースまでのお約束をバージョンごとに定形化

## 使い方

1. `npm i -g board-template` 等で、本モジュールをインストールしておきます
2. `template-sample.md` を参考に、プロジェクトのテンプレートを用意します
3. `.env.sample` を参考に `.env` を用意し、不要な入力の省略を行っておきます
	- このステップを省略しても対話型インターフェースで入力できますが、以下3項目くらいは入力しておくことをお勧めします
	- GITHUB_TOKEN: GitHubのアクセストークンです
	- GITHUB_OWNER: repositoryを管理しているorganizationまたはユーザ名です
	- GITHUB_REPOSTIROY: 対象のrepository名です
4. `board-template` を実行し、作成するプロジェクト名を入力

以上でProjectとIssueが登録されます。

## プロジェクトテンプレートについて

マークダウンで記述します。

（現状は適当なパーサなので適当な事を書くとバグる可能性がありますがご容赦ください。適当に直して使ってください）

練習用repositoryを作って、何種類か用意しておくといいかもしれないです。

## 留意事項

### GitHubのAPI利用規約

本モジュールはGitHubのAPIに依存しています。

一応APIのコール数が派手な事にならないよう、`.env` にWAITという値をミリ秒単位で記載できるようにしていますが（デフォルトは50msecです）、ご自分のトークンを利用して自動アクセスする事になるので、GitHubから怒られないように利用してください。

念のため規約を再確認されることをお勧めします。実行時に`dump rate limit` という情報を出力しているので、そのremainingの値も参考になるかもしれません。

https://help.github.com/ja/github/site-policy/github-terms-of-service#h-api-terms

### 設定が上手くきかない値

- columnsの説明の値は一応入れられますが、意味のある値にはなりません
- Issueのラベル設定はサポートしたいんですが、既存のラベル名を指定するとエラーになって動作しないので諦め中
	- 誰か助けて

## LICENSE

MITです。

詳しくは[LICENSE](./LICENSE)をご参照ください。
