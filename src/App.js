import React, { useState, useCallback } from "react";
import { useQuery } from "react-query";

const createUrl = (page, value) => {
  const url = "https://api.punkapi.com/v2/beers";

  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        per_page: 10,
        page,
        beer_name: value ? value : undefined
      }).filter(([_, value]) => value !== undefined)
    )
  ).toString();

  return `${url}?${params}`;
};

export default function App() {
  const [page, setPage] = useState(1);

  const url = createUrl(page);

  const { data, error, isLoading } = useQuery(url, async () => {
    const response = await fetch(url);
    const json = await response.json();

    return json;
  });

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="App">
      <h1>Brewdog API</h1>
      {error ? (
        <h1>an error occured :/</h1>
      ) : (
        <List data={data} handlePageChange={handlePageChange} page={page} />
      )}
    </div>
  );
}

function Search({ value, onChange }) {
  return (
    <label>
      <input
        type="search"
        placeholder="search"
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

const relevantKeys = ["name", "description", "tagline"];

function List({ data, handlePageChange, page }) {
  const [sortDirection, setSortDirection] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [search, setSearch] = useState("");

  const handleSortChange = useCallback(
    () => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc")),
    []
  );

  const handleOrderByChange = useCallback(
    (column) => {
      // already ordered by this column; must be a direction change as 2nd click
      if (column === orderBy) {
        handleSortChange();
      } else {
        // not sordered by this column yet
        setOrderBy(column);
      }
    },
    [handleSortChange, orderBy]
  );

  const handleSearch = useCallback(({ target: { value } }) => {
    setSearch(value.trim().toLowerCase());
  }, []);

  const sortedData = data
    .sort((a, b) => {
      if (sortDirection === "asc") {
        return a[orderBy] > b[orderBy] ? 1 : -1;
      }

      return a[orderBy] > b[orderBy] ? -1 : 1;
    })
    .filter((dataset) => {
      // no point in filtering if search is empty
      if (search.length === 0) {
        return true;
      }

      // any of the keys declared relevant can match in any way
      return relevantKeys.some((key) =>
        dataset[key].toLowerCase().includes(search)
      );
    });

  return (
    <>
      <Search value={search} onChange={handleSearch} />

      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th onClick={() => handleOrderByChange("name")}>Name</th>
            <th onClick={() => handleOrderByChange("description")}>
              Description
            </th>
            <th onClick={() => handleOrderByChange("Tagline")}>Tagline</th>
            <th onClick={() => handleOrderByChange("abv")}>ABV</th>
          </tr>
        </thead>
        <thead>
          <tr>
            <th colSpan="2">
              <button
                type="button"
                disabled={page === 1}
                onClick={
                  page === 1 ? undefined : () => handlePageChange(page - 1)
                }
              >
                last page
              </button>
            </th>

            <th colSpan="2">
              <button type="button" onClick={() => handlePageChange(page + 1)}>
                next page
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(
            ({ id, name, image_url, description, tagline, abv }) => (
              <tr key={id}>
                <td>
                  <img
                    src={image_url}
                    alt={name}
                    loading="lazy"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "100px"
                    }}
                  />
                  {name}
                </td>
                <td>{tagline}</td>
                <td title={description}>{description.slice(0, 20)}...</td>
                <td>{abv}%</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </>
  );
}
