# Interactive Assignment Library

This repository is a GitHub Pages-ready hub for hosting multiple HTML assignments from one deployment.

## Structure

```text
student-notebooks-site/
├── index.html
├── assets/
│   ├── ewl-theme.css
│   └── assignment-shell.js
└── assignments/
    ├── _template/
    │   └── index.html
    ├── volume-rectangular-prisms/
    │   └── index.html
    ├── area-review/
    │   └── index.html
    └── hebrew-word-sort/
        └── index.html
```

## How to add a new assignment

1. Copy `assignments/_template/`.
2. Rename the copied folder using lowercase words and hyphens.
3. Replace the folder's `index.html` with the finished assignment HTML.
4. Add a new card to the homepage `index.html`.
5. Keep relative asset links like this from assignment folders:

```html
<link rel="stylesheet" href="../../assets/ewl-theme.css" />
<script src="../../assets/assignment-shell.js"></script>
```

## Student link pattern

After GitHub Pages is enabled:

```text
https://baltimoreteacher1.github.io/student-notebooks-site/
```

Assignment folders use clean URLs:

```text
https://baltimoreteacher1.github.io/student-notebooks-site/assignments/volume-rectangular-prisms/
```

## Important note

This repository is currently private. For students to access GitHub Pages publicly, the repo may need to be public or GitHub Pages must be supported for private repositories on the account plan.
